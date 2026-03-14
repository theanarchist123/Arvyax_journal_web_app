"""
LLM Service — Google Gemini integration with caching.

Cache strategy: SHA-256 hash of the journal text → skip LLM if we already
analyzed identical text → saves API cost and latency.
"""
from __future__ import annotations
import hashlib
import json
import re
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()


def _parse_llm_json(raw: str) -> dict:
    """Robustly extract JSON from LLM output even if it includes markdown fences."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON object with regex
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse LLM response as JSON: {raw[:200]}")


async def analyze_emotion(text: str) -> dict:
    """
    Calls Gemini to analyze emotion in journal text.
    Returns: { emotion, keywords, summary }
    """
    import google.generativeai as genai

    if not settings.gemini_api_key:
        logger.error("GEMINI_API_KEY is missing")
        raise RuntimeError("LLM configuration error: API key missing")

    genai.configure(api_key=settings.gemini_api_key)
    # Using 'models/' prefix is often more reliable
    model_name = "models/gemini-2.5-pro"
    model = genai.GenerativeModel(model_name)

    prompt = f"""You are an empathetic emotion analysis assistant for a nature therapy journal app.

Analyze the emotional content of the following journal entry and respond with ONLY valid JSON (no markdown, no explanation).

Required JSON format:
{{
  "emotion": "<single dominant emotion: calm | joyful | anxious | sad | reflective | energized | peaceful | grateful | melancholic | hopeful>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "summary": "<One sentence describing the user's mental state during this nature session>"
}}

Journal entry:
\"\"\"{text}\"\"\"

Respond with ONLY the JSON object:"""

    try:
        response = await model.generate_content_async(prompt)
        
        # Check if response was blocked or empty
        if not response.parts:
            logger.error(f"Gemini response blocked. Prompt feedback: {response.prompt_feedback}")
            raise RuntimeError("LLM response was blocked by safety filters.")

        raw_text = response.text
        logger.info(f"Gemini raw response: {raw_text[:100]}…")
        
        result = _parse_llm_json(raw_text)
        
        # Validate and normalise
        return {
            "emotion": str(result.get("emotion", "reflective")).lower().strip(),
            "keywords": [str(kw) for kw in result.get("keywords", [])][:5],
            "summary": str(result.get("summary", "")),
        }
    except Exception as exc:
        logger.error(f"Gemini analysis failed [Model: {model_name}]: {exc}", exc_info=True)
        # Throw specific error so router catches it
        raise RuntimeError(f"LLM analysis failed: {exc}") from exc


async def analyze_emotion_stream(text: str):
    """
    Generator that yields streaming chunks from Gemini.
    Used by the /analyze endpoint with SSE.
    """
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.5-pro")

    prompt = f"""Analyze the emotional content of this nature journal entry.
Return ONLY valid JSON (no markdown fences, no explanation) with this structure:
{{
  "emotion": "Dominant emotion",
  "keywords": ["key1", "key2"],
  "summary": "Short 1-sentence mental state summary"
}}

Journal Entry: \"\"\"{text}\"\"\"

Only JSON:"""

    async for chunk in await model.generate_content_async(prompt, stream=True):
        if chunk.text:
            yield chunk.text


def get_text_hash(text: str) -> str:
    return _hash_text(text)
