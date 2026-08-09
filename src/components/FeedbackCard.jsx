function FeedbackCard({ feedback }) {
  if (!feedback) return null;

  return (
    <div className="feedback-container">

      <div className="feedback-header">
        <div>
          <p className="small-heading">INTERVIEW COMPLETE</p>
          <h1>Technical Interview Report</h1>
        </div>

        <div className="score-circle">
          <span>{feedback.score || 0}</span>
          <small>/100</small>
        </div>
      </div>

      <div className="feedback-summary">
        <h3>Overall Assessment</h3>
        <p>
          {feedback.summary ||
            "The candidate demonstrated a solid understanding of the concepts discussed during the interview."}
        </p>
      </div>

      <div className="feedback-grid">

        <div className="feedback-box">
          <h3>✓ Strengths</h3>

          <ul>
            {(feedback.strengths || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-box">
          <h3>△ Areas to Improve</h3>

          <ul>
            {(feedback.weaknesses || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

      </div>

      <div className="recommendations">
        <h3>Recommended Next Steps</h3>

        {(feedback.recommendations || []).map(
          (item, index) => (
            <div className="recommendation" key={index}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          )
        )}
      </div>

    </div>
  );
}

export default FeedbackCard;