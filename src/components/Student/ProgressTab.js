import React, { useState } from 'react';
import './ProgressTab.css';

const ProgressTab = ({ 
  examData, 
  answers, 
  visitedQuestions,
  currentSectionIndex, 
  currentQuestionIndex,
  isSectionWise,
  onQuestionNavigate,
  isPaused 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all questions for linear exams
  const getLinearQuestions = () => {
    return examData.questions || examData.exam?.questions || [];
  };

  // Get sections for section-wise exams
  const getSections = () => {
    return examData.sections || examData.exam?.sections || [];
  };

  // Calculate progress statistics
  const calculateProgress = () => {
    if (isSectionWise) {
      const sections = getSections();
      return sections.map(section => {
        const questions = section.questions || [];
        const answered = questions.filter(q => answers[q.id]).length;
        const visited = questions.filter(q => visitedQuestions.has(q.id)).length;
        const notVisited = questions.length - visited;
        
        return {
          sectionId: section.id,
          sectionName: section.name,
          total: questions.length,
          answered,
          visitedNotAnswered: visited - answered,
          notVisited
        };
      });
    } else {
      const questions = getLinearQuestions();
      const answered = Object.keys(answers).length;
      const visited = visitedQuestions.size;
      const visitedNotAnswered = visited - answered;
      const notVisited = questions.length - visited;

      return {
        total: questions.length,
        answered,
        visitedNotAnswered,
        notVisited
      };
    }
  };

  const progressData = calculateProgress();

  const handleQuestionClick = (sectionIndex, questionIndex, questionId) => {
    if (!isPaused) {
      onQuestionNavigate(sectionIndex, questionIndex);
    }
  };

  // Get question status for styling
  const getQuestionStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (visitedQuestions.has(questionId)) return 'visited';
    return 'not-visited';
  };

  return (
    <div className={`progress-tab ${isExpanded ? 'expanded' : ''}`}>
      <div className="progress-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>📊 Exam Progress</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="progress-content">
          {/* Overall Summary */}
          <div className="progress-summary">
            <h4>Overall Progress</h4>
            {isSectionWise ? (
              <div className="section-summary">
                {progressData.map((section, index) => (
                  <div key={section.sectionId} className="section-progress-item">
                    <div className="section-header">
                      <span className="section-name">{section.sectionName}</span>
                      <span className="section-stats">
                        {section.answered}/{section.total}
                      </span>
                    </div>
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini answered"
                        style={{ width: `${(section.answered / section.total) * 100}%` }}
                      ></div>
                      <div 
                        className="progress-fill-mini visited"
                        style={{ width: `${(section.visitedNotAnswered / section.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="progress-details">
                      <span className="progress-detail answered">Answered: {section.answered}</span>
                      <span className="progress-detail visited">Visited: {section.visitedNotAnswered}</span>
                      <span className="progress-detail not-visited">Unvisited: {section.notVisited}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="linear-summary">
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-dot answered"></span>
                    <span>Answered: {progressData.answered}/{progressData.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-dot visited"></span>
                    <span>Visited but not answered: {progressData.visitedNotAnswered}/{progressData.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-dot not-visited"></span>
                    <span>Not visited: {progressData.notVisited}/{progressData.total}</span>
                  </div>
                </div>
                <div className="progress-bar-overall">
                  <div 
                    className="progress-segment answered"
                    style={{ width: `${(progressData.answered / progressData.total) * 100}%` }}
                    title={`Answered: ${progressData.answered}`}
                  ></div>
                  <div 
                    className="progress-segment visited"
                    style={{ width: `${(progressData.visitedNotAnswered / progressData.total) * 100}%` }}
                    title={`Visited: ${progressData.visitedNotAnswered}`}
                  ></div>
                  <div 
                    className="progress-segment not-visited"
                    style={{ width: `${(progressData.notVisited / progressData.total) * 100}%` }}
                    title={`Not visited: ${progressData.notVisited}`}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Question Grid */}
          <div className="questions-grid">
            <h4>Question Navigation</h4>
            {isSectionWise ? (
              <div className="section-questions">
                {getSections().map((section, sectionIndex) => (
                  <div key={section.id} className="section-questions-group">
                    <div className="section-title">
                      Section {sectionIndex + 1}: {section.name}
                    </div>
                    <div className="questions-list">
                      {(section.questions || []).map((question, questionIndex) => (
                        <button
                          key={question.id}
                          className={`question-number ${getQuestionStatus(question.id)} ${
                            currentSectionIndex === sectionIndex && currentQuestionIndex === questionIndex ? 'current' : ''
                          }`}
                          onClick={() => handleQuestionClick(sectionIndex, questionIndex, question.id)}
                          disabled={isPaused}
                          title={`Q${questionIndex + 1}: ${getQuestionStatus(question.id).replace('-', ' ')}`}
                        >
                          {questionIndex + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="linear-questions">
                {getLinearQuestions().map((question, index) => (
                  <button
                    key={question.id}
                    className={`question-number ${getQuestionStatus(question.id)} ${
                      currentQuestionIndex === index ? 'current' : ''
                    }`}
                    onClick={() => handleQuestionClick(0, index, question.id)}
                    disabled={isPaused}
                    title={`Q${index + 1}: ${getQuestionStatus(question.id).replace('-', ' ')}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="progress-legend">
            <div className="legend-item">
              <div className="legend-color answered"></div>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <div className="legend-color visited"></div>
              <span>Visited</span>
            </div>
            <div className="legend-item">
              <div className="legend-color not-visited"></div>
              <span>Not Visited</span>
            </div>
            <div className="legend-item">
              <div className="legend-color current"></div>
              <span>Current</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;