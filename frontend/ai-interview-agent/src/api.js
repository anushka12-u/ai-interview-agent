const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";


export async function startInterview(candidateId, jobPosition) {
    const response = await fetch(
        `${API_BASE_URL}/start-interview`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                candidate_id: candidateId,
                job_position: jobPosition,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.detail || "Unable to start interview"
        );
    }

    return response.json();
}


export async function sendAnswer(sessionId, answer) {
    const response = await fetch(
        `${API_BASE_URL}/answer`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                session_id: sessionId,
                answer: answer,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.detail || "Unable to submit answer"
        );
    }

    return response.json();
}


export async function getFeedback(sessionId) {
    const response = await fetch(
        `${API_BASE_URL}/feedback/${sessionId}`
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.detail || "Unable to generate feedback"
        );
    }

    return response.json();
}