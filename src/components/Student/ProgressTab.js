// ProgressTab.jsx
import React, { useState, useEffect } from 'react';
import './ProgressTab.css';

const ProgressTab = ({ 
  examData, 
  answers, 
  currentSectionIndex, 
  currentQuestionIndex,
  isSectionWise = false,
  visitedQuestions = [] 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);

  // Calculate progress data
  const calculateProgress = () => {
    if (!examData) return null;

    if (isSectionWise) {
      const sections = examData.sections || examData.exam?.sections || [];
      return sections.map((section, index) => {
        const sectionQuestions = section.questions || [];
        const answered = sectionQuestions.filter(q => answers[q.id]).length;
        const visited = sectionQuestions.filter(q => 
          visitedQuestions.includes(q.id) && !answers[q.id]
        ).length;
        const unanswered = sectionQuestions.length - answered - visited;

        return {
          id: section.id,
          name: section.name,
          total: sectionQuestions.length,
          answered,
          visited,
          unanswered,
          progress: (answered / sectionQuestions.length) * 100
        };
      });
    } else {
      // Linear exam progress
      const questions = examData.questions || examData.exam?.questions || [];
      const answered = Object.keys(answers).length;
      const visited = visitedQuestions.filter(qId => !answers[qId]).length;
      const unanswered = questions.length - answered - visited;

      return {
        total: questions.length,
        answered,
        visited,
        unanswered,
        progress: (answered / questions.length) * 100
      };
    }
  };

  const progressData = calculateProgress();
  const isFullScreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  // Auto-expand in full screen, collapse when not
  useEffect(() => {
    setIsExpanded(isFullScreen);
  }, [isFullScreen]);

  // Set default selected section for section-wise exams
  useEffect(() => {
    if (isSectionWise && progressData && progressData.length > 0) {
      setSelectedSection(currentSectionIndex);
    }
  }, [isSectionWise, progressData, currentSectionIndex]);

  if (!progressData) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getSectionProgress = (section) => (
    <div className="section-progress-details">
      <div className="progress-row">
        <span className="progress-label">Answered:</span>
        <span className="progress-count answered">
          {section.answered}/{section.total}
        </span>
      </div>
      <div className="progress-row">
        <span className="progress-label">Visited:</span>
        <span className="progress-count visited">
          {section.visited}/{section.total}
        </span>
      </div>
      <div className="progress-row">
        <span className="progress-label">Unanswered:</span>
        <span className="progress-count unanswered">
          {section.unanswered}/{section.total}
        </span>
      </div>
      <div className="progress-bar-mini">
        <div 
          className="progress-fill-mini"
          style={{ width: `${section.progress}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className={`progress-tab ${isExpanded ? 'expanded' : 'collapsed'} ${isFullScreen ? 'full-screen' : ''}`}>
      {/* Header */}
      <div className="progress-tab-header" onClick={toggleExpand}>
        <div className="progress-tab-title">
          <span className="progress-icon">📊</span>
          {isExpanded && <span>Exam Progress</span>}
        </div>
        <div className="progress-tab-actions">
          {isExpanded && (
            <span className="progress-percentage">
              {isSectionWise 
                ? `${Math.round(progressData.reduce((acc, section) => acc + section.answered, 0) / progressData.reduce((acc, section) => acc + section.total, 0) * 100)}%`
                : `${Math.round(progressData.progress)}%`
              }
            </span>
          )}
          <button className="progress-toggle-btn">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="progress-tab-content">
          {isSectionWise ? (
            // Section-wise progress
            <div className="section-wise-progress">
              <div className="section-selector">
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(parseInt(e.target.value))}
                  className="section-dropdown"
                >
                  {progressData.map((section, index) => (
                    <option key={section.id} value={index}>
                      {section.name} ({section.answered}/{section.total})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedSection !== null && progressData[selectedSection] && (
                <div className="selected-section-progress">
                  <h4>{progressData[selectedSection].name}</h4>
                  {getSectionProgress(progressData[selectedSection])}
                </div>
              )}

              {/* Overall summary */}
              <div className="overall-summary">
                <h5>Overall Progress</h5>
                <div className="progress-row">
                  <span className="progress-label">Total Answered:</span>
                  <span className="progress-count answered">
                    {progressData.reduce((acc, section) => acc + section.answered, 0)}/
                    {progressData.reduce((acc, section) => acc + section.total, 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Linear exam progress
            <div className="linear-progress">
              {getSectionProgress(progressData)}
            </div>
          )}

          {/* Visual Progress Indicators */}
          <div className="progress-visual">
            <div className="progress-legend">
              <div className="legend-item">
                <span className="legend-color answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-color visited"></span>
                <span>Visited</span>
              </div>
              <div className="legend-item">
                <span className="legend-color unanswered"></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact view when collapsed */}
      {!isExpanded && (
        <div className="progress-tab-compact">
          <span className="compact-progress">
            {isSectionWise 
              ? `${progressData.reduce((acc, section) => acc + section.answered, 0)}/${progressData.reduce((acc, section) => acc + section.total, 0)}`
              : `${progressData.answered}/${progressData.total}`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;