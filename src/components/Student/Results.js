import React, { useState, useEffect } from 'react';
import './Results.css';

const Results = ({ onNotification }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/student/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON, got:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setResults(data);
      if (onNotification) {
        onNotification(`Loaded ${data.length} exam results`, 'success');
      }
    } catch (error) {
      const errorMsg = 'Error fetching results';
      setError(errorMsg);
      if (onNotification) {
        onNotification(`${errorMsg}: ${error.message}`, 'error');
      }
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (onNotification) {
      onNotification('Retrying to load results...', 'info');
    }
    setLoading(true);
    setError('');
    fetchResults();
  };

  const handleRefresh = () => {
    if (onNotification) {
      onNotification('Refreshing results...', 'info');
    }
    fetchResults();
  };

  const viewDetails = (result) => {
    setSelectedResult(result);
    if (onNotification) {
      onNotification(`Viewing details for: ${result.exam.title}`, 'info');
    }
  };

  const closeDetails = () => {
    setSelectedResult(null);
    if (onNotification) {
      onNotification('Closed result details', 'info');
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#10b981'; // Green
    if (percentage >= 70) return '#f59e0b'; // Amber
    if (percentage >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getGradeText = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="results-header">
          <h1>My Results</h1>
          <p>Tracking your academic progress</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="results-header">
          <h1>My Results</h1>
          <p>Tracking your academic progress</p>
        </div>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load results</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>My Results</h1>
        <p>Tracking your academic progress</p>
        <div className="results-summary">
          <div className="summary-card">
            <span className="summary-number">{results.length}</span>
            <span className="summary-label">Exams Completed</span>
          </div>
          <div className="summary-card">
            <span className="summary-number">
              {results.length > 0 ? Math.max(...results.map(r => r.percentage)).toFixed(1) : 0}%
            </span>
            <span className="summary-label">Best Score</span>
          </div>
          <div className="summary-card">
            <span className="summary-number">
              {results.length > 0 ? (results.reduce((sum, r) => sum + parseFloat(r.percentage), 0) / results.length).toFixed(1) : 0}%
            </span>
            <span className="summary-label">Average</span>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">📊</div>
          <h3>No Results Yet</h3>
          <p>Complete some exams to see your results here.</p>
          <button onClick={handleRefresh} className="refresh-btn">
            Refresh
          </button>
        </div>
      ) : (
        <div className="results-content">
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={result.id} className="result-card">
                <div className="card-header">
                  <h3>{result.exam.title}</h3>
                  <span className="card-badge">#{index + 1}</span>
                </div>
                
                <div className="card-description">
                  <p>{result.exam.description || 'No description available'}</p>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span>Score: {result.score}/{result.totalMarks}</span>
                    <span style={{ color: getGradeColor(result.percentage) }}>
                      {result.percentage}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${result.percentage}%`,
                        backgroundColor: getGradeColor(result.percentage)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grade-info">
                  <span className="grade-text" style={{ color: getGradeColor(result.percentage) }}>
                    {getGradeText(result.percentage)}
                  </span>
                </div>

                <div className="card-footer">
                  <div className="exam-info">
                    <div className="info-item">
                      <span className="info-label">Completed:</span>
                      <span className="info-value">
                        {new Date(result.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Time Taken:</span>
                      <span className="info-value">--:--</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => viewDetails(result)}
                    className="details-btn"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Details Modal */}
      {selectedResult && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedResult.exam.title} - Detailed Results</h2>
              <button onClick={closeDetails} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="detailed-stats">
                <div className="stat-item">
                  <span className="stat-label">Raw Score</span>
                  <span className="stat-value">{selectedResult.score}/{selectedResult.totalMarks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Percentage</span>
                  <span 
                    className="stat-value" 
                    style={{ color: getGradeColor(selectedResult.percentage) }}
                  >
                    {selectedResult.percentage}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Grade</span>
                  <span 
                    className="stat-value"
                    style={{ color: getGradeColor(selectedResult.percentage) }}
                  >
                    {getGradeText(selectedResult.percentage)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion Date</span>
                  <span className="stat-value">
                    {new Date(selectedResult.completedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="exam-description">
                <h4>Exam Description</h4>
                <p>{selectedResult.exam.description || 'No description available.'}</p>
              </div>

              <div className="answers-section">
                <h4>Question-wise Performance</h4>
                <div className="answers-list">
                  <p>Detailed question analysis would appear here...</p>
                  {/* You can expand this section later with actual question data */}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeDetails} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;