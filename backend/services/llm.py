import os
import json
import re

from functools import lru_cache

from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# Configuration
# --------------------------------------------------

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception:
        client = None

MODEL = "gemini-3.6-flash"


# --------------------------------------------------
# Cached generation
# --------------------------------------------------

@lru_cache(maxsize=100)
def _generate_cached(prompt: str) -> str:
    if client is None:
        # Fallback mock response for local development
        return "(mock) Generated content"

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text.strip()


# --------------------------------------------------
# Generate first question
# --------------------------------------------------

def generate_question(
    candidate,
    curriculum_day,
    difficulty="easy"
):

    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "prompts",
        "question_prompt.txt"
    )

    with open(
        prompt_path,
        "r",
        encoding="utf-8"
    ) as file:

        prompt_template = file.read()

    prompt = prompt_template.format(
        candidate_name=candidate["member"]["name"],
        job_role=candidate["member"]["jobRole"],
        experience=candidate["member"]["yearsExperience"],
        education=candidate["member"]["education"],
        day=curriculum_day["day"],
        title=curriculum_day["title"],
        type=curriculum_day["type"],
        tools=", ".join(
            curriculum_day["tools"]
        ),
        objectives="\n".join(
            "- " + obj
            for obj in curriculum_day["objectives"]
        ),
        difficulty=difficulty
    )

    if client is None:
        return f"Mock question for {curriculum_day.get('title')} (difficulty={difficulty})"

    return _generate_cached(prompt)


# --------------------------------------------------
# Evaluate answer + generate follow-up
# ONE LLM CALL
# --------------------------------------------------

def evaluate_and_generate_followup(
    candidate,
    curriculum_day,
    question,
    answer,
    difficulty,
    history
):

    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "prompts",
        "evaluate_followup_prompt.txt"
    )

    with open(
        prompt_path,
        "r",
        encoding="utf-8"
    ) as file:

        prompt_template = file.read()

    prompt = prompt_template.format(
        candidate_name=candidate["member"]["name"],
        job_role=candidate["member"]["jobRole"],
        experience=candidate["member"]["yearsExperience"],
        education=candidate["member"]["education"],

        day=curriculum_day["day"],
        title=curriculum_day["title"],

        question=question,
        answer=answer,

        difficulty=difficulty,

        history=json.dumps(
            history,
            ensure_ascii=False
        )
    )

    if client is None:

     raw = json.dumps({
        "score": 5,
        "strength": "Reasonable approach",
        "weakness": "Missing edge cases",
        "correctness": "partial",
        "next_difficulty": "medium",
        "next_question": f"Follow-up on {curriculum_day.get('title')}"
     })

    else:

      response = client.models.generate_content(
        model=MODEL,
        contents=prompt
      )

    raw = response.text.strip()
    # ----------------------------------------------

    try:

        return json.loads(raw)

    except json.JSONDecodeError:

        # Try extracting JSON from markdown
        match = re.search(
            r"\{.*\}",
            raw,
            re.DOTALL
        )

        if match:

            try:
                return json.loads(
                    match.group(0)
                )

            except json.JSONDecodeError:
                pass

    # ----------------------------------------------
    # Safe fallback
    # ----------------------------------------------

    return {
        "score": 0,
        "strength": "",
        "weakness": "",
        "correctness": "",
        "next_difficulty": "easy",
        "next_question": None
    }


# --------------------------------------------------
# Final feedback
# ONE LLM CALL
# --------------------------------------------------

def generate_feedback(candidate, compact_history):

    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "prompts",
        "feedback_prompt.txt"
    )

    with open(
        prompt_path,
        "r",
        encoding="utf-8"
    ) as file:
        prompt_template = file.read()

    prompt = prompt_template.format(
        candidate_name=candidate["member"]["name"],
        job_role=candidate["member"]["jobRole"],
        experience=candidate["member"]["yearsExperience"],
        education=candidate["member"]["education"],
        history=json.dumps(
            compact_history,
            ensure_ascii=False
        )
    )

    if client is None:
        return {
            "overall_score": 53,
            "summary": "The candidate demonstrates good conceptual understanding but needs greater technical depth and practical implementation knowledge.",
            "strengths": [
                "Understands vector databases and semantic search at a high level.",
                "Understands the accuracy versus latency trade-off in ANN search.",
                "Understands the difference between zero-shot and few-shot prompting."
            ],
            "weaknesses": [
                "Limited understanding of IVF and HNSW internals.",
                "Answers lack implementation-level detail.",
                "Production metrics were not discussed."
            ],
            "technical_assessment": [
                {
                    "topic": "Vector Databases",
                    "score": 6
                },
                {
                    "topic": "ANN Algorithms",
                    "score": 5
                },
                {
                    "topic": "Prompt Engineering",
                    "score": 4
                },
                {
                    "topic": "LLM Applications",
                    "score": 4
                }
            ],
            "recommendations": [
                "Study IVF, HNSW and Product Quantization.",
                "Practice explaining algorithms with concrete examples.",
                "Learn production metrics such as latency, recall@k and throughput."
            ]
        }

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    raw = response.text.strip()

    try:
        return json.loads(raw)

    except json.JSONDecodeError:

        match = re.search(
            r"\{.*\}",
            raw,
            re.DOTALL
        )

        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    return {
        "overall_score": 0,
        "summary": "Unable to generate structured feedback.",
        "strengths": [],
        "weaknesses": [],
        "technical_assessment": [],
        "recommendations": []
    }