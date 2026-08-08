const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startInterview(candidateId) {
  const response = await fetch(
    `${API_BASE_URL}/api/interview/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to start interview");
  }

  return response.json();
}

export async function sendAnswer(interviewId, answer) {
  const response = await fetch(
    `${API_BASE_URL}/api/interview/respond`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interview_id: interviewId,
        answer: answer,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to send answer");
  }

  return response.json();
}

export async function endInterview(interviewId) {
  const response = await fetch(
    `${API_BASE_URL}/api/interview/end`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interview_id: interviewId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to generate feedback");
  }

  return response.json();
}