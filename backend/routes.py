from fastapi import APIRouter, HTTPException

from backend.model.schemas import (
    InterviewRequest,
    AnswerRequest
)

from backend.services.interview import (
    start_interview,
    get_candidate,
    get_current_curriculum,
    save_answer,
    save_question,
    save_evaluation,
    get_session,
    next_curriculum_day,
    interview_finished,
    interview_time_expired
)
from backend.services.llm import (
    generate_question,
    evaluate_and_generate_followup,
    generate_feedback
)


router = APIRouter()


# ==================================================
# START INTERVIEW
# ==================================================

@router.post("/start-interview")
def start_interview_route(
    request: InterviewRequest
):

    candidate = get_candidate(
        request.candidate_id
    )

    if candidate is None:

        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    session_id = start_interview(
        request.candidate_id
    )

    if session_id is None:

        raise HTTPException(
            status_code=400,
            detail="Could not create interview"
        )

    curriculum_day = get_current_curriculum(
        session_id
    )

    if curriculum_day is None:

        raise HTTPException(
            status_code=400,
            detail="No curriculum day available"
        )

    # First question ALWAYS easy
    question = generate_question(
        candidate,
        curriculum_day,
        difficulty="easy"
    )

    save_question(
        session_id,
        question
    )

    session = get_session(session_id)

    session["difficulty"] = "easy"

    return {
        "session_id": session_id,
        "question": question,
        "question_number": 1,
        "day": curriculum_day["day"],
        "topic": curriculum_day["title"]
    }


# ==================================================
# SUBMIT ANSWER
# ==================================================

@router.post("/answer")
def submit_answer(
    request: AnswerRequest
):

    # ----------------------------------------------
    # Get session
    # ----------------------------------------------

    session = get_session(
        request.session_id
    )

    if session is None:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    # ----------------------------------------------
    # Check 5-minute limit
    # ----------------------------------------------

    if interview_time_expired(
        request.session_id
    ):

        return {
            "session_id": request.session_id,
            "message": "Interview time limit reached",
            "feedback_available": True
        }

    # ----------------------------------------------
    # Get previous question
    # ----------------------------------------------

    question = ""

    for item in reversed(
        session["history"]
    ):

        if item["role"] == "assistant":

            question = item["content"]
            break

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Previous question not found"
        )

    # ----------------------------------------------
    # Save answer
    # ----------------------------------------------

    save_answer(
        request.session_id,
        request.answer
    )

    # ----------------------------------------------
    # Candidate
    # ----------------------------------------------

    candidate = get_candidate(
        session["candidate_id"]
    )

    # ----------------------------------------------
    # Current curriculum
    # ----------------------------------------------

    curriculum_day = get_current_curriculum(
        request.session_id
    )

    if curriculum_day is None:

        return {
            "session_id": request.session_id,
            "message": "Interview completed",
            "feedback_available": True
        }

    # ----------------------------------------------
    # Compact history
    # ----------------------------------------------

    compact_history = session[
        "compact_history"
    ][-4:]

    # ----------------------------------------------
    # ONE LLM CALL
    # Evaluate + next question
    # ----------------------------------------------

    result = evaluate_and_generate_followup(

        candidate=candidate,

        curriculum_day=curriculum_day,

        question=question,

        answer=request.answer,

        difficulty=session.get(
            "difficulty",
            "easy"
        ),

        history=compact_history
    )

    # ----------------------------------------------
    # Save evaluation
    # ----------------------------------------------

    result["question"] = question

    save_evaluation(
        request.session_id,
        result
    )

    # ----------------------------------------------
    # Get next difficulty
    # ----------------------------------------------

    next_difficulty = result.get(
        "next_difficulty",
        "easy"
    )

    session["difficulty"] = (
        next_difficulty
    )

    # ----------------------------------------------
    # Check 8-question limit
    # ----------------------------------------------

    if session["questions_asked"] >= 8:

        return {
            "session_id": request.session_id,
            "analysis": result,
            "message": "Interview completed",
            "feedback_available": True
        }

    # ----------------------------------------------
    # Check 5-minute limit
    # ----------------------------------------------

    if interview_time_expired(
        request.session_id
    ):

        return {
            "session_id": request.session_id,
            "analysis": result,
            "message": "Interview time limit reached",
            "feedback_available": True
        }

    # ----------------------------------------------
    # Next question
    # ----------------------------------------------

    followup = result.get(
        "next_question"
    )

    if not followup:

        return {
            "session_id": request.session_id,
            "analysis": result,
            "message": "Interview completed",
            "feedback_available": True
        }

    # ----------------------------------------------
    # Save next question
    # ----------------------------------------------

    save_question(
        request.session_id,
        followup
    )

    # ----------------------------------------------
    # Move curriculum after 2 questions (evaluate after increment)
    # ----------------------------------------------

    if session.get(
        "questions_asked_current_day", 0
    ) >= 2:

        next_curriculum_day(
            request.session_id
        )

        curriculum_day = get_current_curriculum(
            request.session_id
        )

        if curriculum_day is None:

            return {
                "session_id": request.session_id,
                "analysis": result,
                "message": "Interview completed",
                "feedback_available": True
            }

    return {
        "session_id": request.session_id,

        "analysis": result,

        "question": followup,

        "question_number": session[
            "questions_asked"
        ],

        "day": curriculum_day["day"],

        "topic": curriculum_day["title"]
    }


# ==================================================
# FINAL FEEDBACK
# ==================================================

@router.get(
    "/feedback/{session_id}"
)
def get_feedback(
    session_id: str
):

    session = get_session(
        session_id
    )

    if session is None:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    candidate = get_candidate(
        session["candidate_id"]
    )

    feedback = generate_feedback(
        candidate,
        session.get(
            "compact_history",
            []
        )
    )

    return {
        "session_id": session_id,
        "feedback": feedback
    }


# --------------------------------------------------
# Frontend-compatible API wrappers
# --------------------------------------------------


@router.post("/api/interview/start")
def api_start(payload: dict):
    candidate_id = payload.get("candidate_id") or payload.get("candidateId")

    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id is required")

    req = InterviewRequest(candidate_id=candidate_id)

    resp = start_interview_route(req)

    # Map backend keys to frontend expectations
    return {
        "interview_id": resp.get("session_id"),
        "question": resp.get("question"),
        "question_number": resp.get("question_number"),
        "day": resp.get("day"),
        "topic": resp.get("topic"),
    }


@router.post("/api/interview/respond")
def api_respond(payload: dict):
    interview_id = payload.get("interview_id") or payload.get("interviewId")
    answer = payload.get("answer")

    if not interview_id or answer is None:
        raise HTTPException(status_code=400, detail="interview_id and answer are required")

    req = AnswerRequest(session_id=interview_id, answer=answer)

    resp = submit_answer(req)

    # submit_answer returns keys like 'session_id', 'analysis', 'question',
    # 'question_number', 'day', 'topic'. Map to frontend-friendly names.
    return {
        "interview_id": resp.get("session_id"),
        "analysis": resp.get("analysis"),
        "question": resp.get("question"),
        "question_number": resp.get("question") and resp.get("question_number") or resp.get("question_number"),
        "day": resp.get("day"),
        "topic": resp.get("topic"),
    }


@router.post("/api/interview/end")
def api_end(payload: dict):
    interview_id = payload.get("interview_id") or payload.get("interviewId")

    if not interview_id:
        raise HTTPException(status_code=400, detail="interview_id is required")

    resp = get_feedback(interview_id)

    # get_feedback returns { session_id, feedback }
    return {
        "interview_id": resp.get("session_id"),
        "feedback": resp.get("feedback"),
    }