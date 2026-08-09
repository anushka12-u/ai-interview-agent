import json
import uuid
import os
import time

# --------------------------------------------------
# Load data
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

CURRICULUM_PATH = os.path.join(
    BASE_DIR,
    "data",
    "curriculum.json"
)

CANDIDATES_PATH = os.path.join(
    BASE_DIR,
    "data",
    "candidates.json"
)

with open(CURRICULUM_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
    curriculum = data["days"]

with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
    candidates = data["candidates"]


# Temporary in-memory sessions
sessions = {}


# --------------------------------------------------
# Get candidate
# --------------------------------------------------

def get_candidate(candidate_id):

    for candidate in candidates:

        if candidate["member"]["id"] == candidate_id:
            return candidate

    return None


# --------------------------------------------------
# Get curriculum day
# --------------------------------------------------

def get_curriculum_day(day_number):

    for day in curriculum:

        if day["day"] == day_number:
            return day

    return None


# --------------------------------------------------
# Start interview
# --------------------------------------------------

def start_interview(candidate_id):

    candidate = get_candidate(candidate_id)

    if not candidate:
        return None

    completed_days = [
        mission["day"]
        for mission in candidate["missions"]
        if mission.get("passed") is True
    ]

    selected_days = completed_days[:5]

    if len(selected_days) < 4:
        return None

    session_id = str(uuid.uuid4())

    sessions[session_id] = {

        "candidate_id": candidate_id,

        "selected_days": selected_days,

        "current_day_index": 0,

        # Interview control
        "questions_asked": 0,
        "questions_asked_current_day": 0,

        # Difficulty
        "difficulty": "easy",

        # Time limit
        "started_at": time.time(),
        "max_duration": 300,  # 5 minutes

        # Conversation
        "history": [],

        # Compact information sent to LLM
        "compact_history": [],

        # Results
        "answers": [],
        "scores": [],
        "covered_days": []
    }

    return session_id


# --------------------------------------------------
# Get current curriculum
# --------------------------------------------------

def get_current_curriculum(session_id):

    session = sessions.get(session_id)

    if session is None:
        return None

    index = session["current_day_index"]

    if index >= len(session["selected_days"]):
        return None

    day_number = session["selected_days"][index]

    return get_curriculum_day(day_number)


# --------------------------------------------------
# Save question
# --------------------------------------------------

def save_question(session_id, question):

    session = sessions.get(session_id)

    if session is None:
        return False

    session["history"].append({
        "role": "assistant",
        "content": question
    })

    session["questions_asked"] += 1
    session["questions_asked_current_day"] += 1

    return True


# --------------------------------------------------
# Save answer
# --------------------------------------------------

def save_answer(session_id, answer):

    session = sessions.get(session_id)

    if session is None:
        return False

    session["history"].append({
        "role": "user",
        "content": answer
    })

    session["answers"].append(answer)

    return True


# --------------------------------------------------
# Save evaluation
# --------------------------------------------------

def save_evaluation(session_id, evaluation):

    session = sessions.get(session_id)

    if session is None:
        return False

    session["scores"].append(
        evaluation.get("score", 0)
    )

    session["compact_history"].append({
        "question": evaluation.get("question", ""),
        "score": evaluation.get("score", 0),
        "strength": evaluation.get("strength", ""),
        "weakness": evaluation.get("weakness", ""),
        "correctness": evaluation.get("correctness", "")
    })

    # Keep only recent evaluations
    session["compact_history"] = (
        session["compact_history"][-4:]
    )

    return True


# --------------------------------------------------
# Move to next curriculum day
# --------------------------------------------------

def next_curriculum_day(session_id):

    session = sessions.get(session_id)

    if session is None:
        return False

    current_day = get_current_curriculum(session_id)

    if current_day:

        day_number = current_day["day"]

        if day_number not in session["covered_days"]:

            session["covered_days"].append(
                day_number
            )

    session["current_day_index"] += 1
    session["questions_asked_current_day"] = 0

    return True


# --------------------------------------------------
# Check 5-minute limit
# --------------------------------------------------

def interview_time_expired(session_id):

    session = sessions.get(session_id)

    if session is None:
        return True

    elapsed = time.time() - session["started_at"]

    return elapsed >= session["max_duration"]


# --------------------------------------------------
# Check whether interview is finished
# --------------------------------------------------

def interview_finished(session_id):

    session = sessions.get(session_id)

    if session is None:
        return True

    # Maximum 8 questions
    if session["questions_asked"] >= 8:
        return True

    # Maximum 5 minutes
    if interview_time_expired(session_id):
        return True

    # At least 4 curriculum days covered
    if len(session["covered_days"]) >= 4:
        return True

    return False


# --------------------------------------------------
# Get session
# --------------------------------------------------

def get_session(session_id):

    return sessions.get(session_id)