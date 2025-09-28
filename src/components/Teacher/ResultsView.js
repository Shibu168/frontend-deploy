import React, { useState, useEffect } from 'react';

const ResultsView = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [exam.id]);

  const fetchResults = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/teacher/exams/${exam.id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch results');
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Network error: Unable to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/teacher/exams/${exam.id}/results/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        alert('Failed to download results');
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Error downloading results');
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="results-view">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>Results for {exam.title}</h2>
          <button onClick={onBack} className="btn btn-secondary">Back to Exams</button>
        </div>
        <div className="error-message" style={{color: 'red', marginTop: '20px'}}>
          Error: {error}
        </div>
        <button onClick={fetchResults} className="btn btn-primary" style={{marginTop: '10px'}}>
          Retry
        </button>
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
            <button onClick={handleDownload} className="download-btn" style={{marginLeft: '10px'}}>
              Download CSV
            </button>
          )}
        </div>
      </div>
      
      {results.length === 0 ? (
        <p>No results available yet.</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>Score</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Completion Time</th>
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

              return (
                <tr key={attempt.id}>
                  <td>{attempt.student.name}</td>
                  <td>{attempt.student.email}</td>
                  <td>{obtainedMarks}</td>
                  <td>{totalMarks}</td>
                  <td>{percentage.toFixed(2)}%</td>
                  <td>{completionTime}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResultsView;