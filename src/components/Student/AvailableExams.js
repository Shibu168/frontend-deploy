import React, { useState, useEffect } from 'react';

const AvailableExams = ({ onExamSelect }) => {
  const [exams, setExams] = useState({ public: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('public');

  // ✅ Always use env variable
  const API_BASE = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    fetchAvailableExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailableExams = async () => {
    try {
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

  // AvailableExams.js - Simple fix
const handleExamSelect = async (exam) => {
  if (exam.visibility === 'public' || exam.visibility === 'shared') {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/student/exams/${exam.id}/start`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const examData = await response.json();
        // SIMPLE FIX: Pass examData.exam instead of examData
        onExamSelect(examData.exam);
      } else {
        const errorData = await response.json();
        alert('Failed to start exam: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Error starting exam. Please try again.');
    }
  } else {
    alert('This is a private exam. Please use the shareable link provided by your teacher.');
  }
};

  if (loading) {
    return <div className="loading">Loading available exams...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const totalExams = exams.public.length + exams.shared.length;

  return (
    <div className="available-exams">
      <h2>Available Exams</h2>
      
      {totalExams === 0 ? (
        <div className="no-exams">
          <p>No exams available at the moment.</p>
          <p>If you have a private exam link, ask your teacher to share it with you.</p>
        </div>
      ) : (
        <>
          {/* Tabs for Public and Shared Exams */}
          <div className="exams-tabs">
            <button 
              className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              Public Exams ({exams.public.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveTab('shared')}
            >
              Shared with Me ({exams.shared.length})
            </button>
          </div>

          {/* Public Exams */}
          {activeTab === 'public' && (
            <div className="exam-grid">
              {exams.public.length === 0 ? (
                <div className="no-exams">
                  <p>No public exams available.</p>
                </div>
              ) : (
                exams.public.map(exam => (
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
                ))
              )}
            </div>
          )}

          {/* Shared Exams */}
          {activeTab === 'shared' && (
            <div className="exam-grid">
              {exams.shared.length === 0 ? (
                <div className="no-exams">
                  <p>No exams have been shared with you.</p>
                  <p>Your teacher can share exams specifically with your email address.</p>
                </div>
              ) : (
                exams.shared.map(exam => (
                  <div key={exam.id} className="exam-card shared-exam">
                    <h3>{exam.title}</h3>
                    <p className="exam-description">{exam.description}</p>
                    <div className="exam-meta">
                      <span>⏱️ {exam.duration_minutes} minutes</span>
                      <span>📅 {new Date(exam.start_time).toLocaleDateString()}</span>
                      <span className="shared-badge">Shared with you</span>
                    </div>
                    <div className="teacher-info">
                      <small>By: {exam.creator?.name || 'Teacher'}</small>
                    </div>
                    <button 
                      onClick={() => handleExamSelect(exam)}
                      className="start-exam-btn"
                    >
                      Start Exam
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableExams;