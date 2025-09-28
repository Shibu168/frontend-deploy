import React, { useState, useEffect } from 'react';

const ResultsView = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend URLs from environment variables
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  console.log('API Base URL:', API_BASE);

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

  if (loading) {
    return (
      <div className="results-view">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>Results for {exam.title}</h2>
          <button onClick={onBack} className="btn btn-secondary">Back to Exams</button>
        </div>
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="results-view">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Results for {exam.title}</h2>
        <div>
          <button onClick={onBack} className="btn btn-secondary">Back to Exams</button>
          {results.length > 0 && (
            <button 
              onClick={handleDownload} 
              className="download-btn" 
              style={{marginLeft: '10px'}}
              disabled={!API_BASE}
            >
              Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!API_BASE && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Backend Not Configured:</strong> Cannot fetch results without backend URL
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchResults} 
            className="btn btn-primary" 
            style={{marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      )}
      
      {!error && results.length === 0 ? (
        <div style={{marginTop: '20px', textAlign: 'center'}}>
          <p>No results available yet.</p>
          <p>Students need to complete the exam for results to appear here.</p>
        </div>
      ) : (
        <div style={{marginTop: '20px'}}>
          <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Student Results ({results.length} students)</h3>
            {!API_BASE && (
              <p style={{color: 'red'}}>
                Download disabled: Backend URL not configured
              </p>
            )}
          </div>
          
          <table className="results-table" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{backgroundColor: '#f8f9fa'}}>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left'}}>Student Name</th>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'left'}}>Email</th>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>Score</th>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>Total Marks</th>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>Percentage</th>
                <th style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>Completion Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map((attempt) => {
                const totalMarks = attempt.answers.reduce((sum, answer) => 
                  sum + (answer.question ? answer.question.marks : 0), 0);
                const obtainedMarks = attempt.answers.reduce((sum, answer) => 
                  sum + (answer.marks_obtained || 0), 0);
                const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                const completionTime = attempt.end_time ? 
                  new Date(attempt.end_time).toLocaleString() : 'Not completed';

                // Color coding for percentage
                const getPercentageColor = (percent) => {
                  if (percent >= 80) return '#28a745'; // Green
                  if (percent >= 60) return '#ffc107'; // Yellow
                  if (percent >= 40) return '#fd7e14'; // Orange
                  return '#dc3545'; // Red
                };

                return (
                  <tr key={attempt.id} style={{borderBottom: '1px solid #dee2e6'}}>
                    <td style={{padding: '12px', border: '1px solid #dee2e6'}}>{attempt.student?.name || 'N/A'}</td>
                    <td style={{padding: '12px', border: '1px solid #dee2e6'}}>{attempt.student?.email || 'N/A'}</td>
                    <td style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold'}}>
                      {obtainedMarks}
                    </td>
                    <td style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                      {totalMarks}
                    </td>
                    <td style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', color: getPercentageColor(percentage), fontWeight: 'bold'}}>
                      {percentage.toFixed(2)}%
                    </td>
                    <td style={{padding: '12px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                      {completionTime}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary Statistics */}
          {results.length > 0 && (
            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
              <h4>Summary Statistics</h4>
              <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                <div>
                  <strong>Total Students:</strong> {results.length}
                </div>
                <div>
                  <strong>Average Score:</strong> {(results.reduce((sum, attempt) => {
                    const obtainedMarks = attempt.answers.reduce((sum, answer) => 
                      sum + (answer.marks_obtained || 0), 0);
                    return sum + obtainedMarks;
                  }, 0) / results.length).toFixed(2)}
                </div>
                <div>
                  <strong>Highest Score:</strong> {Math.max(...results.map(attempt => 
                    attempt.answers.reduce((sum, answer) => sum + (answer.marks_obtained || 0), 0)
                  ))}
                </div>
                <div>
                  <strong>Lowest Score:</strong> {Math.min(...results.map(attempt => 
                    attempt.answers.reduce((sum, answer) => sum + (answer.marks_obtained || 0), 0)
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsView;