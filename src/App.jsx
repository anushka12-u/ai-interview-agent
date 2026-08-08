import { useState } from "react";

import ChatMessage from "./components/ChatMessage";
import ProgressBar from "./components/ProgressBar";
import FeedbackCard from "./components/FeedbackCard";

import {
  startInterview,
  sendAnswer,
  endInterview,
} from "./api";

import "./App.css";


function App() {

  const [screen, setScreen] = useState("landing");

  const [candidateId, setCandidateId] = useState("");

  const [interviewId, setInterviewId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [answer, setAnswer] = useState("");

  const [questionNumber, setQuestionNumber] = useState(0);

  const [totalQuestions] = useState(8);

  const [currentTopic, setCurrentTopic] =
    useState("Getting Started");

  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState(null);


  async function handleStart() {

    if (!candidateId.trim()) {
      alert("Please enter candidate ID");
      return;
    }

    try {

      setLoading(true);

      const data = await startInterview(candidateId);

      setInterviewId(data.interview_id);

      setQuestionNumber(1);

      setCurrentTopic(
        data.topic || "Introduction"
      );

      setMessages([
        {
          sender: "ai",
          text:
            data.question ||
            "Welcome! Let's begin. Tell me about the most interesting AI system you built during the cohort.",
          topic: data.topic || "Introduction",
        },
      ]);

      setScreen("interview");

    } catch (error) {

      console.error(error);

      // Demo fallback
      setInterviewId("demo-interview");

      setQuestionNumber(1);

      setCurrentTopic("RAG");

      setMessages([
        {
          sender: "ai",
          text:
            "Welcome to your technical interview. Let's start with something you built. Can you explain how Retrieval-Augmented Generation works and why you would use it instead of relying only on the language model?",
          topic: "RAG",
        },
      ]);

      setScreen("interview");

    } finally {

      setLoading(false);

    }
  }


  async function handleSubmitAnswer() {

    if (!answer.trim() || loading) return;

    const userMessage = {
      sender: "user",
      text: answer,
    };

    setMessages(prev => [
      ...prev,
      userMessage,
    ]);

    const submittedAnswer = answer;

    setAnswer("");

    try {

      setLoading(true);

      const data = await sendAnswer(
        interviewId,
        submittedAnswer
      );

      setQuestionNumber(
        data.question_number ||
        questionNumber + 1
      );

      setCurrentTopic(
        data.topic ||
        currentTopic
      );

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text:
            data.question ||
            "That's interesting. Can you explain the engineering trade-off behind that decision?",
          topic:
            data.topic ||
            currentTopic,
        },
      ]);

    } catch (error) {

      console.error(error);

      setQuestionNumber(
        questionNumber + 1
      );

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text:
            "Good. Let's go one level deeper. What trade-offs did you consider when designing that system?",
          topic: currentTopic,
        },
      ]);

    } finally {

      setLoading(false);

    }
  }


  async function handleEndInterview() {

    try {

      setLoading(true);

      const data =
        await endInterview(interviewId);

      setFeedback(data);

      setScreen("feedback");

    } catch (error) {

      console.error(error);

      setFeedback({
        score: 78,

        summary:
          "You demonstrated a good understanding of modern AI engineering concepts and were able to explain several architectural decisions.",

        strengths: [
          "Good understanding of RAG architecture",
          "Able to explain engineering decisions",
          "Good awareness of AI system components",
        ],

        weaknesses: [
          "Some explanations could be more structured",
          "Need deeper understanding of production trade-offs",
          "Could improve explanation of failure scenarios",
        ],

        recommendations: [
          "Practice explaining system architecture using a structured approach.",
          "Review vector database indexing and retrieval strategies.",
          "Study production monitoring and evaluation of LLM systems.",
        ],
      });

      setScreen("feedback");

    } finally {

      setLoading(false);

    }
  }


  function resetInterview() {

    setScreen("landing");

    setCandidateId("");

    setInterviewId(null);

    setMessages([]);

    setAnswer("");

    setQuestionNumber(0);

    setFeedback(null);

  }


  if (screen === "landing") {

    return (

      <div className="app">

        <header className="navbar">

          <div className="logo">
            <div className="logo-icon">AI</div>
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
              <span>Prove your expertise.</span>
            </h1>

            <p className="hero-description">
              A personalized technical interview based on
              your AI engineering journey.
            </p>


            <div className="candidate-form">

              <label>
                Candidate ID
              </label>

              <input
                type="text"
                placeholder="e.g. candidate_001"
                value={candidateId}
                onChange={(e) =>
                  setCandidateId(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleStart();
                  }
                }}
              />

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
                <strong>8+</strong>
                <span>Questions</span>
              </div>

              <div>
                <strong>4+</strong>
                <span>AI Topics</span>
              </div>

              <div>
                <strong>∞</strong>
                <span>Follow-ups</span>
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
                "You mentioned using RAG in your project.
                Why did you choose a vector database instead
                of a traditional relational database?"
              </p>

              <div className="mock-topic">
                RAG · VECTOR DATABASES
              </div>

              <div className="mock-input">
                Explain your approach...
                <button>↑</button>
              </div>

            </div>

          </div>

        </main>

      </div>

    );
  }


  if (screen === "interview") {

    return (

      <div className="interview-page">

        <header className="interview-navbar">

          <div className="logo">
            <div className="logo-icon">AI</div>
            Interview Agent
          </div>

          <div className="interview-topic">

            <span>Currently assessing</span>

            <strong>
              {currentTopic}
            </strong>

          </div>

          <button
            className="end-button"
            onClick={handleEndInterview}
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
                  AI Cohort Candidate
                </small>
              </div>

            </div>


            <ProgressBar
              current={questionNumber}
              total={totalQuestions}
            />


            <div className="topics">

              <h4>Interview Focus</h4>

              <div className="topic-item active">
                <span>●</span>
                RAG
              </div>

              <div className="topic-item">
                <span>○</span>
                Vector Databases
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
                MCP
              </div>

              <div className="topic-item">
                <span>○</span>
                AI Deployment
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
                  Explain your reasoning. Think like an engineer.
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

                  AI interviewer is thinking...

                </div>

              )}

            </div>


            <div className="answer-area">

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
                placeholder="Type your answer here..."
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
                  Press Enter to submit · Shift + Enter for new line
                </span>

                <button
                  className="send-button"
                  onClick={handleSubmitAnswer}
                  disabled={
                    loading ||
                    !answer.trim()
                  }
                >
                  Send Answer ↑
                </button>

              </div>

            </div>

          </main>

        </div>

      </div>

    );
  }


  return (

    <div className="feedback-page">

      <header className="interview-navbar">

        <div className="logo">
          <div className="logo-icon">AI</div>
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