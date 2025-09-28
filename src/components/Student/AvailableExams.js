import React, { useState, useEffect } from 'react';

const AvailableExams = ({ onExamSelect }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000' 
        : '';
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/student/exams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        setError('Failed to load exams');
      }
    } catch (error) {
      setError('Error loading exams');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (exam) => {
    // For public exams, fetch the details using the public route
    if (exam.visibility === 'public') {
      try {
        const API_BASE = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000' 
          : '';
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/student/exams/${exam.id}/start`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const examData = await response.json();
          onExamSelect(examData);
        } else {
          const errorData = await response.json();
          alert('Failed to start exam: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error starting exam:', error);
        alert('Error starting exam. Please try again.');
      }
    } else {
      // This should not happen for public exams in the dashboard
      alert('This is a private exam. Please use the shareable link provided by your teacher.');
    }
  };

  if (loading) {
    return <div className="loading">Loading available exams...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="available-exams">
      <h2>Available Exams</h2>
      {exams.length === 0 ? (
        <div className="no-exams">
          <p>No public exams available at the moment.</p>
          <p>If you have a private exam link, ask your teacher to share it with you.</p>
        </div>
      ) : (
        <div className="exam-grid">
          {exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <h3>{exam.title}</h3>
              <p className="exam-description">{exam.description}</p>
              <div className="exam-meta">
                <span>⏱️ {exam.duration_minutes} minutes</span>
                <span>📅 {new Date(exam.start_time).toLocaleDateString()}</span>
                <span className={`visibility-badge ${exam.visibility}`}>
                  {exam.visibility}
                </span>
              </div>
              <button 
                onClick={() => handleExamSelect(exam)}
                className="start-exam-btn"
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableExams;