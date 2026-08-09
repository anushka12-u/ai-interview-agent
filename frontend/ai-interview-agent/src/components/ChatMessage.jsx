function ChatMessage({ message }) {
  const isAI = message.sender === "ai";

  return (
    <div className={`message-row ${isAI ? "ai-row" : "user-row"}`}>
      {isAI && (
        <div className="avatar ai-avatar">
          AI
        </div>
      )}

      <div className={`message ${isAI ? "ai-message" : "user-message"}`}>
        <div className="message-label">
          {isAI ? "AI Interviewer" : "You"}
        </div>

        <div className="message-text">
          {message.text}
        </div>

        {message.topic && (
          <div className="topic-tag">
            {message.topic}
          </div>
        )}
      </div>

      {!isAI && (
        <div className="avatar user-avatar">
          You
        </div>
      )}
    </div>
  );
}

export default ChatMessage;