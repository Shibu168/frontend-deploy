// SubmissionConfirmation.jsx
import React from 'react';

const SubmissionConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  progressData,
  isSectionWise
}) => {
  if (!isOpen) return null;

  const renderProgressSummary = () => {
    if (isSectionWise) {
      return (
        <div className="section-submission-summary">
          <h4>Section-wise Progress</h4>
          {progressData.map((section, index) => (
            <div key={section.id} className="section-summary-item">
              <div className="section-summary-header">
                <span className="section-name">{section.name}</span>
                <span className="section-progress">
                  {section.answered}/{section.total} answered
                </span>
              </div>
              <div className="section-details">
                <span className="progress-detail answered">
                  ✅ {section.answered} Answered
                </span>
                <span className="progress-detail visited">
                  🔶 {section.visited} Visited
                </span>
                <span className="progress-detail unanswered">
                  ❌ {section.unanswered} Unanswered
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="linear-submission-summary">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-label">Total Questions:</span>
              <span className="stat-value">{progressData.total}</span>
            </div>
            <div className="stat-item answered">
              <span className="stat-label">Answered:</span>
              <span className="stat-value">{progressData.answered}</span>
            </div>
            <div className="stat-item visited">
              <span className="stat-label">Visited but Unanswered:</span>
              <span className="stat-value">{progressData.visited}</span>
            </div>
            <div className="stat-item unanswered">
              <span className="stat-label">Unanswered:</span>
              <span className="stat-value">{progressData.unanswered}</span>
            </div>
          </div>
          <div className="progress-percentage-final">
            Completion: {Math.round(progressData.progress)}%
          </div>
        </div>
      );
    }
  };

  return (
    <div className="submission-confirmation-overlay">
      <div className="submission-confirmation-modal">
        <div className="confirmation-header">
          <h3>Submit Exam</h3>
          <p>Please review your progress before final submission</p>
        </div>
        
        <div className="confirmation-content">
          {renderProgressSummary()}
          
          <div className="warning-message">
            ⚠️ Once submitted, you cannot change your answers. This action is irreversible.
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="btn btn-primary"
          >
            Confirm Submission
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;