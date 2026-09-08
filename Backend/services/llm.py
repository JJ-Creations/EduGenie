"""
LLM service — Groq Cloud API via openai/gpt-oss-120b.
Handles structured summaries, robust raw JSON schemas, and conversational chat.
"""
import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))
MODEL_ID = "openai/gpt-oss-120b"



def generate_summary(context: str) -> dict:
    prompt = (
        "You are an expert academic tutor. Analyze the text below and provide a structured summary. "
        "You must return your output strictly as a raw JSON object matching this exact schema:\n"
        "{\n"
        '  "introduction": "An introductory paragraph introducing the main theme and scope.",\n'
        '  "core_takeaways": ["Takeaway 1", "Takeaway 2"],\n'
        '  "actionable_steps": ["Step 1", "Step 2"]\n'
        "}\n\n"
        f"Text Material:\n{context}"
    )
    
    completion = client.chat.completions.create(
        model=MODEL_ID,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type":"json_object"}
    )
    raw_json=completion.choices[0].message.content
    return json.loads(raw_json)

def generate_chat_reply(context: str, query: str) -> str:
    prompt = (
        "You are an empathetic, expert AI study assistant named EduGenie. "
        "Answer the student's question accurately using the reference context provided below. "
        "If the answer cannot be found in the context, guide them using general knowledge but note the limitation.\n\n"
        f"Reference Context:\n{context}\n\n"
        f"Student Question: {query}"
    )
    
    completion = client.chat.completions.create(
        model=MODEL_ID,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )
    return completion.choices[0].message.content.strip()


# ── MCQ Quiz ──────────────────────────────────────────────────────────────────

def generate_mcq(context: str, n: int = 5, difficulty: str = "medium") -> list[dict]:
    prompt = (
        f"Generate exactly {n} high-quality multiple-choice questions at a {difficulty} difficulty level "
        "based on the text below. "
        "Return your output strictly as a JSON object containing a 'questions' array "
        "matching this exact structure:\n"
        '{"questions": ['
        '{"question": "string", '
        '"options": {"A": "str", "B": "str", "C": "str", "D": "str"}, '
        '"answer": "A"}'
        "]}\n\n"
        f"Text:\n{context}"
    )

    completion = client.chat.completions.create(
        model=MODEL_ID,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"}
    )

    raw_json = completion.choices[0].message.content
    data = json.loads(raw_json)

    if isinstance(data, dict) and "questions" in data:
        return data["questions"]

    return []

# ── Flash Cards ───────────────────────────────────────────────────────────────

def generate_flashcards(context: str) -> list[dict]:
    prompt = (
        "Create exactly 5 comprehensive flashcards from the text below. "
        "You must return your output strictly as a raw JSON object containing a 'cards' array matching this structure:\n"
        '{\n'
        '  "cards": [\n'
        '    {"front": "term or question", "back": "definition or answer"}\n'
        '  ]\n'
        '}\n\n'
        f"Text:\n{context}"
    )
    try:
        completion = client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        raw_json = completion.choices[0].message.content
        data = json.loads(raw_json)
    
    # Handle top-level object wrapping fallbacks safely
        if isinstance(data, dict) and "flashcards" in data:
            return data["flashcards"]
        if isinstance(data, dict) and "cards" in data:
            return data["cards"]
        if isinstance(data, dict) and not isinstance(data, list):
            return list(data.values())[0] if data else []
        return data if isinstance(data,list) else []
    except Exception as e:
        print(f"Groq API Refusal or Parsing Error: {e}")
        return []