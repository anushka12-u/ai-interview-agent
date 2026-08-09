import { useState } from "react";

import {
  startInterview,
  sendAnswer,
  getFeedback,
} from "./api";

import "./App.css";

// ============================================================
// CHAT MESSAGE
// ============================================================

function ChatMessage({ message }) {
  return (
    <div
      className={`message ${
        message.sender === "user"
          ? "user-message"
          : "ai-message"
      }`}
    >
      <div className="message-label">
        {message.sender === "user"
          ? "YOU"
          : "AI INTERVIEWER"}
      </div>

      <div className="message-text">
        {message.text}
      </div>

      {message.topic && (
        <div className="message-topic">
          {message.topic}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROGRESS BAR
// ============================================================

function ProgressBar({ current, total }) {
  const percentage =
    total > 0
      ? Math.min((current / total) * 100, 100)
      : 0;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span>Interview Progress</span>

        <strong>
          {current}/{total}
        </strong>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <small>
        {Math.round(percentage)}% completed
      </small>
    </div>
  );
}

// ============================================================
// PARSE TEXT FEEDBACK
// ============================================================

function parseFeedbackText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const result = {
    overall_score: null,
    summary: "",
    strengths: [],
    weaknesses: [],
    technical: "",
    llm: "",
    recommendations: [],
    final_verdict: "",
    raw: text,
  };

  // ----------------------------------------------------------
  // Extract overall score
  // Supports:
  // Overall Score: 53/100
  // Overall Score** 53/100
  // Score: 53
  // ----------------------------------------------------------

  const scoreMatch = text.match(
    /(?:Overall\s*Score|Score)\s*:?\*{0,2}\s*(\d+(?:\.\d+)?)\s*(?:\/\s*100)?/i
  );

  if (scoreMatch) {
    result.overall_score = Number(scoreMatch[1]);
  }

  // ----------------------------------------------------------
  // Extract sections
  // ----------------------------------------------------------

  function extractSection(names) {
    const sectionPattern = names.join("|");

    const regex = new RegExp(
      `(?:\\*\\*)?(${sectionPattern})(?:\\*\\*)?\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*)?(?:Overall Score|Strengths|Weaknesses|Recommendations|Technical Assessment|LLM Workflows|Final Verdict|Summary|Rationale|$)(?:\\*\\*)?\\s*:?)`,
      "i"
    );

    const match = text.match(regex);

    return match
      ? match[2].trim()
      : "";
  }

  result.summary = extractSection(["Summary"]);

  // ----------------------------------------------------------
  // Convert bullet text into arrays
  // ----------------------------------------------------------

  function extractListSection(names) {
    const content = extractSection(names);

    if (!content) {
      return [];
    }

    return content
      .split(/\n|(?<=\.)\s+(?=\*\*)/)
      .map((item) =>
        item
          .replace(/^[-•*]\s*/, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/\*\*/g, "")
          .trim()
      )
      .filter(Boolean);
  }

  result.strengths =
    extractListSection(["Strengths"]);

  result.weaknesses =
    extractListSection(["Weaknesses"]);

  result.recommendations =
    extractListSection(["Recommendations"]);

  result.technical =
    extractSection([
      "Technical Assessment",
    ]);

  result.llm =
    extractSection([
      "LLM Workflows & Prompt Engineering",
      "LLM Workflows",
    ]);

  result.final_verdict =
    extractSection([
      "Final Verdict",
      "Rationale",
    ]);

  return result;
}

// ============================================================
// FEEDBACK CARD
// ============================================================

function FeedbackCard({ feedback }) {
  if (!feedback) {
    return (
      <div className="feedback-empty">
        <div className="empty-icon">!</div>

        <h2>No feedback available</h2>

        <p>
          The interview feedback could not be
          loaded.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Backend currently returns feedback as a string.
  // Also support object feedback in case backend changes.
  // ----------------------------------------------------------

  let parsed = feedback;

  if (typeof feedback === "string") {
    parsed = parseFeedbackText(feedback);
  }

  if (!parsed) {
    return (
      <div className="feedback-empty">
        No feedback available
      </div>
    );
  }

  const score =
    parsed.overall_score ??
    parsed.score ??
    0;

  const numericScore = Number(score) || 0;

  const scoreLabel =
    numericScore >= 80
      ? "Excellent"
      : numericScore >= 65
      ? "Good"
      : numericScore >= 50
      ? "Needs Improvement"
      : "Needs Work";

  return (
    <main className="feedback-container">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="feedback-title-section">

        <div>
          <div className="feedback-eyebrow">
            INTERVIEW COMPLETED
          </div>

          <h1>
            Interview Feedback
          </h1>

          <p>
            Here's an assessment of your
            technical interview performance.
          </p>
        </div>

        <div className="feedback-status">
          <span className="status-dot"></span>
          Evaluation Complete
        </div>

      </div>

      {/* ====================================================
          SCORE + OVERVIEW
      ==================================================== */}

      <section className="feedback-overview">

        <div className="score-card">

          <div className="score-circle">

            <div className="score-number">
              {numericScore}
            </div>

            <div className="score-total">
              /100
            </div>

          </div>

          <div className="score-info">

            <h2>
              {scoreLabel}
            </h2>

            <p>
              Overall Interview Score
            </p>

          </div>

        </div>

        <div className="overview-stats">

          <div className="stat-card">
            <strong>8</strong>
            <span>Questions</span>
          </div>

          <div className="stat-card">
            <strong>AI</strong>
            <span>Evaluation</span>
          </div>

          <div className="stat-card">
            <strong>5 min</strong>
            <span>Interview Format</span>
          </div>

        </div>

      </section>

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      {parsed.summary && (
        <section className="feedback-section-card">

          <div className="section-heading">
            <div className="section-icon">
              ✦
            </div>

            <div>
              <h2>Summary</h2>

              <p>
                Overall assessment
              </p>
            </div>
          </div>

          <div className="feedback-text">
            {parsed.summary}
          </div>

        </section>
      )}

      {/* ====================================================
          STRENGTHS / WEAKNESSES
      ==================================================== */}

      <div className="feedback-grid">

        {parsed.strengths?.length > 0 && (
          <section className="feedback-section-card">

            <div className="section-heading">

              <div className="section-icon success">
                ✓
              </div>

              <div>
                <h2>Strengths</h2>

                <p>
                  What you did well
                </p>
              </div>

            </div>

            <ul className="feedback-list">

              {parsed.strengths.map(
                (item, index) => (
                  <li key={index}>
                    <span>✓</span>
                    <p>{item}</p>
                  </li>
                )
              )}

            </ul>

          </section>
        )}

        {parsed.weaknesses?.length > 0 && (
          <section className="feedback-section-card">

            <div className="section-heading">

              <div className="section-icon warning">
                !
              </div>

              <div>
                <h2>Areas to Improve</h2>

                <p>
                  Where you can improve
                </p>
              </div>

            </div>

            <ul className="feedback-list">

              {parsed.weaknesses.map(
                (item, index) => (
                  <li key={index}>
                    <span>!</span>
                    <p>{item}</p>
                  </li>
                )
              )}

            </ul>

          </section>
        )}

      </div>

      {/* ====================================================
          TECHNICAL ASSESSMENT
      ==================================================== */}

      {parsed.technical && (
        <section className="feedback-section-card">

          <div className="section-heading">

            <div className="section-icon">
              &lt;/&gt;
            </div>

            <div>
              <h2>
                Technical Assessment
              </h2>

              <p>
                Technical depth and understanding
              </p>
            </div>

          </div>

          <div className="feedback-text">
            {parsed.technical}
          </div>

        </section>
      )}

      {/* ====================================================
          LLM / PROMPT ENGINEERING
      ==================================================== */}

      {parsed.llm && (
        <section className="feedback-section-card">

          <div className="section-heading">

            <div className="section-icon">
              AI
            </div>

            <div>
              <h2>
                AI & Prompt Engineering
              </h2>

              <p>
                LLM workflow assessment
              </p>
            </div>

          </div>

          <div className="feedback-text">
            {parsed.llm}
          </div>

        </section>
      )}

      {/* ====================================================
          RECOMMENDATIONS
      ==================================================== */}

      {parsed.recommendations?.length > 0 && (
        <section className="feedback-section-card">

          <div className="section-heading">

            <div className="section-icon">
              →
            </div>

            <div>
              <h2>
                Recommendations
              </h2>

              <p>
                How to improve your performance
              </p>
            </div>

          </div>

          <ul className="feedback-list">

            {parsed.recommendations.map(
              (item, index) => (
                <li key={index}>
                  <span>→</span>
                  <p>{item}</p>
                </li>
              )
            )}

          </ul>

        </section>
      )}

      {/* ====================================================
          FINAL VERDICT
      ==================================================== */}

      {parsed.final_verdict && (
        <section className="final-verdict">

          <div className="verdict-label">
            FINAL VERDICT
          </div>

          <h2>
            Interview Assessment
          </h2>

          <p>
            {parsed.final_verdict}
          </p>

        </section>
      )}

    </main>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [screen, setScreen] =
    useState("landing");

  const [candidateId, setCandidateId] =
    useState("");

  const [jobPosition, setJobPosition] =
    useState("AI Engineer");

  const [sessionId, setSessionId] =
    useState(null);

  const [questionNumber, setQuestionNumber] =
    useState(0);

  const totalQuestions = 8;

  const [messages, setMessages] =
    useState([]);

  const [answer, setAnswer] =
    useState("");

  const [currentTopic, setCurrentTopic] =
    useState("Getting Started");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [feedback, setFeedback] =
    useState(null);

  // ==========================================================
  // START INTERVIEW
  // ==========================================================

  async function handleStart() {

    if (!candidateId.trim()) {
      setError(
        "Please enter your candidate ID."
      );

      return;
    }

    setError("");

    try {

      setLoading(true);

      const data =
        await startInterview(
          candidateId.trim(),
          jobPosition
        );

      setSessionId(
        data.session_id
      );

      setQuestionNumber(
        data.question_number || 1
      );

      setCurrentTopic(
        data.topic || "Introduction"
      );

      setMessages([
        {
          sender: "ai",

          text:
            data.question ||
            "Let's begin the interview.",

          topic:
            data.topic ||
            "Introduction",
        },
      ]);

      setAnswer("");

      setScreen("interview");

    } catch (error) {

      console.error(
        "Start interview error:",
        error
      );

      setError(
        error.message ||
        "Unable to start interview."
      );

    } finally {

      setLoading(false);

    }
  }

  // ==========================================================
  // SUBMIT ANSWER
  // ==========================================================

  async function handleSubmitAnswer() {

    if (
      !answer.trim() ||
      loading ||
      !sessionId
    ) {
      return;
    }

    const submittedAnswer =
      answer.trim();

    setMessages(
      previous => [
        ...previous,

        {
          sender: "user",
          text: submittedAnswer,
        },
      ]
    );

    setAnswer("");
    setError("");

    try {

      setLoading(true);

      const data =
        await sendAnswer(
          sessionId,
          submittedAnswer
        );

      // ------------------------------------------------------
      // Interview completed
      // ------------------------------------------------------

      if (
        data.message ===
          "Interview completed" ||
        data.message ===
          "Interview time limit reached"
      ) {

        setQuestionNumber(
          data.question_number ||
          questionNumber
        );

        await loadFeedback();

        return;
      }

      // ------------------------------------------------------
      // Question number
      // ------------------------------------------------------

      const nextQuestionNumber =
        data.question_number ||
        questionNumber + 1;

      setQuestionNumber(
        nextQuestionNumber
      );

      // ------------------------------------------------------
      // Topic
      // ------------------------------------------------------

      const nextTopic =
        data.topic ||
        currentTopic;

      setCurrentTopic(
        nextTopic
      );

      // ------------------------------------------------------
      // Next AI question
      // ------------------------------------------------------

      if (data.question) {

        setMessages(
          previous => [
            ...previous,

            {
              sender: "ai",

              text:
                data.question,

              topic:
                nextTopic,
            },
          ]
        );

      }

    } catch (error) {

      console.error(
        "Submit answer error:",
        error
      );

      setError(
        error.message ||
        "Unable to submit answer."
      );

    } finally {

      setLoading(false);

    }
  }

  // ==========================================================
  // LOAD FEEDBACK
  // ==========================================================

  async function loadFeedback() {

    if (!sessionId) {
      return;
    }

    try {

      setLoading(true);

      const data =
        await getFeedback(
          sessionId
        );

      setFeedback(
        data.feedback
      );

      setScreen(
        "feedback"
      );

    } catch (error) {

      console.error(
        "Feedback error:",
        error
      );

      setError(
        error.message ||
        "Unable to generate feedback."
      );

    } finally {

      setLoading(false);

    }
  }

  // ==========================================================
  // END INTERVIEW
  // ==========================================================

  async function handleEndInterview() {

    if (!sessionId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to end the interview?"
      );

    if (!confirmed) {
      return;
    }

    await loadFeedback();
  }

  // ==========================================================
  // RESET
  // ==========================================================

  function resetInterview() {

    setScreen("landing");

    setCandidateId("");

    setJobPosition(
      "AI Engineer"
    );

    setSessionId(null);

    setMessages([]);

    setAnswer("");

    setQuestionNumber(0);

    setCurrentTopic(
      "Getting Started"
    );

    setFeedback(null);

    setError("");
  }

  // ==========================================================
  // LANDING SCREEN
  // ==========================================================

  if (screen === "landing") {

    return (
      <div className="app">

        <header className="navbar">

          <div className="logo">

            <div className="logo-icon">
              AI
            </div>

            Interview Agent

          </div>

          <div className="nav-status">
            ● AI Technical Interview
          </div>

        </header>

        <main className="landing">

          <div className="hero-content">

            <div className="hero-badge">
              31-DAY AI COHORT
            </div>

            <h1>
              Build your knowledge.
              <br />

              <span>
                Prove your expertise.
              </span>
            </h1>

            <p className="hero-description">
              A personalized technical
              interview based on your
              AI engineering journey.
            </p>

            <div className="candidate-form">

              <label>
                Candidate ID
              </label>

              <input
                type="text"
                placeholder="e.g. CAND-003"
                value={candidateId}
                onChange={(e) =>
                  setCandidateId(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter"
                  ) {
                    handleStart();
                  }

                }}
              />

              <label>
                Job Position
              </label>

              <input
                type="text"
                placeholder="e.g. AI Engineer"
                value={jobPosition}
                onChange={(e) =>
                  setJobPosition(
                    e.target.value
                  )
                }
              />

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                className="start-button"
                onClick={handleStart}
                disabled={loading}
              >
                {loading
                  ? "Starting..."
                  : "Start Technical Interview →"}
              </button>

            </div>

            <div className="interview-info">

              <div>
                <strong>8</strong>
                <span>Questions</span>
              </div>

              <div>
                <strong>4+</strong>
                <span>AI Topics</span>
              </div>

              <div>
                <strong>AI</strong>
                <span>Adaptive</span>
              </div>

            </div>

          </div>

          <div className="hero-card">

            <div className="window-header">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="mock-interview">

              <div className="mock-label">
                AI INTERVIEWER
              </div>

              <p>
                "What is a text embedding,
                and how does it represent
                semantic meaning?"
              </p>

              <div className="mock-topic">
                EMBEDDINGS
              </div>

              <div className="mock-input">
                Explain your approach...

                <button>
                  ↑
                </button>
              </div>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ==========================================================
  // INTERVIEW SCREEN
  // ==========================================================

  if (screen === "interview") {

    return (
      <div className="interview-page">

        <header className="interview-navbar">

          <div className="logo">

            <div className="logo-icon">
              AI
            </div>

            Interview Agent

          </div>

          <div className="interview-topic">

            <span>
              Currently assessing
            </span>

            <strong>
              {currentTopic}
            </strong>

          </div>

          <button
            className="end-button"
            onClick={
              handleEndInterview
            }
            disabled={loading}
          >
            End Interview
          </button>

        </header>

        <div className="interview-layout">

          <aside className="interview-sidebar">

            <div className="candidate-card">

              <div className="candidate-avatar">

                {candidateId
                  ? candidateId
                      .charAt(0)
                      .toUpperCase()
                  : "C"}

              </div>

              <div>

                <strong>
                  {candidateId}
                </strong>

                <small>
                  {jobPosition}
                </small>

              </div>

            </div>

            <ProgressBar
              current={
                questionNumber
              }
              total={
                totalQuestions
              }
            />

            <div className="topics">

              <h4>
                Interview Focus
              </h4>

              <div className="topic-item active">
                <span>●</span>
                {currentTopic}
              </div>

              <div className="topic-item">
                <span>○</span>
                Embeddings
              </div>

              <div className="topic-item">
                <span>○</span>
                RAG
              </div>

              <div className="topic-item">
                <span>○</span>
                Prompt Engineering
              </div>

              <div className="topic-item">
                <span>○</span>
                Agentic AI
              </div>

              <div className="topic-item">
                <span>○</span>
                Deployment
              </div>

            </div>

          </aside>

          <main className="chat-area">

            <div className="chat-header">

              <div>

                <h2>
                  Technical Interview
                </h2>

                <p>
                  Explain your reasoning.
                  Think like an engineer.
                </p>

              </div>

              <div className="live-indicator">

                <span></span>

                LIVE

              </div>

            </div>

            <div className="messages">

              {messages.map(
                (message, index) => (

                  <ChatMessage
                    key={index}
                    message={message}
                  />

                )
              )}

              {loading && (

                <div className="typing">

                  <span></span>
                  <span></span>
                  <span></span>

                  AI interviewer
                  is thinking...

                </div>

              )}

            </div>

            {error && (
              <div className="error-message chat-error">
                {error}
              </div>
            )}

            <div className="answer-area">

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(
                    e.target.value
                  )
                }
                placeholder="Type your answer here..."
                disabled={loading}
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {

                    e.preventDefault();

                    handleSubmitAnswer();

                  }

                }}
              />

              <div className="answer-footer">

                <span>
                  Press Enter to submit
                  · Shift + Enter for
                  new line
                </span>

                <button
                  className="send-button"
                  onClick={
                    handleSubmitAnswer
                  }
                  disabled={
                    loading ||
                    !answer.trim()
                  }
                >
                  {loading
                    ? "Evaluating..."
                    : "Send Answer ↑"}
                </button>

              </div>

            </div>

          </main>

        </div>

      </div>
    );
  }

  // ==========================================================
  // FEEDBACK SCREEN
  // ==========================================================

  return (
    <div className="feedback-page">

      <header className="interview-navbar">

        <div className="logo">

          <div className="logo-icon">
            AI
          </div>

          Interview Agent

        </div>

        <button
          className="end-button"
          onClick={resetInterview}
        >
          New Interview
        </button>

      </header>

      <FeedbackCard
        feedback={feedback}
      />

    </div>
  );
}

export default App;