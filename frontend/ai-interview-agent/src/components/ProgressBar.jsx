function ProgressBar({ current, total }) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="progress-container">
      <div className="progress-info">
        <span>Interview Progress</span>
        <span>
          {current} / {total}
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;