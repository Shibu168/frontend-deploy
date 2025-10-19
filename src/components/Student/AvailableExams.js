import React, { useState, useEffect } from 'react';
import './AvailableExams.css';

const AvailableExams = ({ onExamSelect }) => {
  const [exams, setExams] = useState({ public: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('public');

  const API_BASE = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    fetchAvailableExams();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="available-exams">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading available exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="available-exams">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchAvailableExams} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalExams = exams.public.length + exams.shared.length;

  return (
    <div className="available-exams">
      <div className="header-section">
        <h2>Available Exams</h2>
        <p className="subtitle">Choose an exam to get started</p>
      </div>

      {totalExams === 0 ? (
        <div className="no-exams">
          <div className="empty-icon">📚</div>
          <h3>No Exams Available</h3>
          <p>There are no exams available at the moment.</p>
          <p className="hint">If you have a private exam link, ask your teacher to share it with you.</p>
        </div>
      ) : (
        <>
          <div className="exams-tabs">
            <button
              className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              <span className="tab-icon">🌐</span>
              <span className="tab-text">Public Exams</span>
              <span className="tab-count">{exams.public.length}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveTab('shared')}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-text">Shared with Me</span>
              <span className="tab-count">{exams.shared.length}</span>
            </button>
          </div>

          {activeTab === 'public' && (
            <div className="exam-grid">
              {exams.public.length === 0 ? (
                <div className="no-exams">
                  <div className="empty-icon">🔓</div>
                  <h3>No Public Exams</h3>
                  <p>There are no public exams available right now.</p>
                </div>
              ) : (
                exams.public.map((exam, index) => (
                  <div
                    key={exam.id}
                    className="exam-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="card-header">
                      <h3>{exam.title}</h3>
                      <span className={`visibility-badge ${exam.visibility}`}>
                        {exam.visibility === 'public' ? '🌐' : '🔒'} {exam.visibility}
                      </span>
                    </div>

                    <p className="exam-description">{exam.description}</p>

                    <div className="exam-meta">
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">{exam.duration_minutes} min</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span className="meta-text">{formatDate(exam.start_time)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🕐</span>
                        <span className="meta-text">{formatTime(exam.start_time)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExamSelect(exam)}
                      className="start-exam-btn"
                    >
                      <span>Start Exam</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'shared' && (
            <div className="exam-grid">
              {exams.shared.length === 0 ? (
                <div className="no-exams">
                  <div className="empty-icon">📧</div>
                  <h3>No Shared Exams</h3>
                  <p>No exams have been shared with you yet.</p>
                  <p className="hint">Your teacher can share exams specifically with your email address.</p>
                </div>
              ) : (
                exams.shared.map((exam, index) => (
                  <div
                    key={exam.id}
                    className="exam-card shared-exam"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="card-header">
                      <h3>{exam.title}</h3>
                      <span className="shared-badge">
                        👥 Shared
                      </span>
                    </div>

                    <p className="exam-description">{exam.description}</p>

                    <div className="teacher-info">
                      <span className="teacher-icon">👨‍🏫</span>
                      <span>By: {exam.creator?.name || 'Teacher'}</span>
                    </div>

                    <div className="exam-meta">
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">{exam.duration_minutes} min</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span className="meta-text">{formatDate(exam.start_time)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🕐</span>
                        <span className="meta-text">{formatTime(exam.start_time)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExamSelect(exam)}
                      className="start-exam-btn"
                    >
                      <span>Start Exam</span>
                      <span className="btn-arrow">→</span>
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
