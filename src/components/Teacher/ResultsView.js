import React, { useState, useEffect } from 'react';
import './ResultsView.css';

const ResultsView = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchResults();
  }, [exam.id]);

  const fetchResults = async () => {
    try {
      setError(null);

      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch results' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message || 'Network error: Unable to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/results/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exam.title.replace(/\s+/g, '_')}_results.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download results' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      alert(`Error downloading results: ${error.message}`);
    }
  };

  const getPercentageColor = (percent) => {
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(attempt => {
      const obtainedMarks = attempt.answers.reduce((sum, answer) =>
        sum + (answer.marks_obtained || 0), 0);
      return obtainedMarks;
    });

    const totalMarks = results[0]?.answers.reduce((sum, answer) =>
      sum + (answer.question ? answer.question.marks : 0), 0) || 0;

    return {
      totalStudents: results.length,
      averageScore: (scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      totalMarks,
      averagePercentage: totalMarks > 0 ?
        ((scores.reduce((a, b) => a + b, 0) / (results.length * totalMarks)) * 100).toFixed(2) : 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="results-container">
        <div className="results-header">
          <div className="header-content">
            <h1 className="results-title">Exam Results</h1>
            <p className="results-subtitle">{exam.title}</p>
          </div>
          <button onClick={onBack} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="header-content">
          <h1 className="results-title">Exam Results</h1>
          <p className="results-subtitle">{exam.title}</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>
          {results.length > 0 && (
            <button onClick={handleDownload} className="btn-download" disabled={!API_BASE}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download CSV
            </button>
          )}
        </div>
      </div>

      {!API_BASE && (
        <div className="alert alert-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Backend Not Configured</strong>
            <p>Cannot fetch results without backend URL</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchResults} className="retry-btn">Retry</button>
        </div>
      )}

      {!error && results.length === 0 ? (
        <div className="no-results">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2>No results available yet</h2>
          <p>Students need to complete the exam for results to appear here.</p>
        </div>
      ) : results.length > 0 && (
        <>
          {stats && (
            <div className="stats-section">
              <h2>Summary Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.totalStudents}</div>
                    <div className="stat-label-result">Total Students</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.averageScore}</div>
                    <div className="stat-label-result">Average Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.highestScore}</div>
                    <div className="stat-label-result">Highest Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.lowestScore}</div>
                    <div className="stat-label-result">Lowest Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.totalMarks}</div>
                    <div className="stat-label-result">Total Marks</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.averagePercentage}%</div>
                    <div className="stat-label-result">Avg Percentage</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="results-table-section">
            <h2>Student Results ({results.length} students)</h2>
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Total Marks</th>
                    <th>Percentage</th>
                    <th>Completion Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .map(attempt => {
                      const totalMarks = attempt.answers.reduce((sum, answer) =>
                        sum + (answer.question ? answer.question.marks : 0), 0);
                      const obtainedMarks = attempt.answers.reduce((sum, answer) =>
                        sum + (answer.marks_obtained || 0), 0);
                      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                      return { ...attempt, obtainedMarks, totalMarks, percentage };
                    })
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((attempt, index) => {
                      const completionTime = attempt.end_time ?
                        new Date(attempt.end_time).toLocaleString() : 'Not completed';

                      return (
                        <tr key={attempt.id} className="table-row" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td>
                            <div className="rank-badge">
                              {index + 1 === 1 && '🥇'}
                              {index + 1 === 2 && '🥈'}
                              {index + 1 === 3 && '🥉'}
                              {index + 1 > 3 && `#${index + 1}`}
                            </div>
                          </td>
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                {attempt.student?.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <span className="student-name">{attempt.student?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="email-cell">{attempt.student?.email || 'N/A'}</td>
                          <td className="score-cell">
                            <strong>{attempt.obtainedMarks}</strong>
                          </td>
                          <td className="total-cell">{attempt.totalMarks}</td>
                          <td>
                            <div className={`percentage-badge ${getPercentageColor(attempt.percentage)}`}>
                              {attempt.percentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="time-cell">{completionTime}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsView;
