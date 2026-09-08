"""
Retrieval-Augmented Generation helper.

Strategy
--------
1. Split the document into overlapping chunks.
2. For each task, pick the most relevant chunks via TF-IDF cosine similarity
   against a task-specific seed query.
3. Return a context string that scales into the Llama-3.3 context window budget.
"""
from __future__ import annotations

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Config ────────────────────────────────────────────────────────────────────

CHUNK_SIZE = 500         # Upbed slightly for more coherent document contexts
CHUNK_OVERLAP = 100      # Maintains comfortable semantic overlap intervals
MAX_CONTEXT_WORDS = 8000 # 🚀 EXPANDED: Llama-3.3 handles massive inputs with ease!

# Fixed Base Task Queries
TASK_QUERIES = {
    "summarize":   "main idea key points overview summary executive takeaways structural outline",
    "mcq":         "important facts concepts definitions examples formulas processes technical data",
    "flashcards":  "key terms definitions concepts vocabulary core definitions items rules metrics",
}


# ── Public API ────────────────────────────────────────────────────────────────

def build_rag_context(text: str, task: str) -> str:
    chunks = _chunk_text(text)
    if not chunks:
        return text[:MAX_CONTEXT_WORDS * 6]  # fallback: first structural window slice

    # 🛠️ FIXED: Standardizes wildcard tasks (e.g., 'mcq_hard' -> looks up 'mcq')
    base_task = task.split("_")[0].lower() if "_" in task else task.lower()
    query = TASK_QUERIES.get(base_task, "important information data facts concepts core details")
    
    ranked = _rank_chunks(chunks, query)

    context_words: list[str] = []
    for chunk in ranked:
        words = chunk.split()
        if len(context_words) + len(words) > MAX_CONTEXT_WORDS:
            break
        context_words.extend(words)

    return " ".join(context_words)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _chunk_text(text: str) -> list[str]:
    # Standardize spaces and lines before slicing text
    clean_text = re.sub(r'\s+', ' ', text).strip()
    words = clean_text.split()
    
    chunks = []
    start = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunks.append(" ".join(words[start:end]))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def _rank_chunks(chunks: list[str], query: str) -> list[str]:
    try:
        corpus = [query] + chunks
        vec = TfidfVectorizer(stop_words="english")
        tfidf = vec.fit_transform(corpus)
        
        # Calculates similarity metrics against index item zero (the task seed query)
        scores = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()
        ranked_idx = scores.argsort()[::-1]
        return [chunks[i] for i in ranked_idx]
    except Exception:
        return chunks  # fallback: original structural file reading order