import React, { useState, useEffect } from 'react';

const ExamList = ({ onExamSelect }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${examId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setExams(exams.filter(exam => exam.id !== examId));
          alert('Exam deleted successfully');
        } else {
          alert('Failed to delete exam');
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Error deleting exam. Please try again.');
      }
    }
  };

  const copyExamLink = (exam) => {
    if (exam.visibility === 'private' && exam.shareable_token) {
      const examLink = `${window.location.origin}/exam/${exam.shareable_token}`;
      navigator.clipboard.writeText(examLink);
      setCopiedToken(exam.id);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  const getExamLink = (exam) => {
    if (exam.visibility === 'private' && exam.shareable_token) {
      return `${window.location.origin}/exam/${exam.shareable_token}`;
    }
    return null;
  };

  if (loading) return <div className="loading">Loading exams...</div>;

  return (
    <div className="teacher-exam-list">
      <h2>My Exams</h2>
      {exams.length === 0 ? (
        <div className="no-exams">
          <p>No exams found. Create your first exam to get started!</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <div className="exam-header">
                <h3>{exam.title}</h3>
                <div className="exam-badges">
                  <span className={`status-badge ${exam.status}`}>{exam.status}</span>
                  <span className={`visibility-badge ${exam.visibility}`}>{exam.visibility}</span>
                </div>
              </div>
              
              <p className="exam-description">{exam.description}</p>
              
              <div className="exam-meta">
                <span>⏱️ {exam.duration_minutes} min</span>
                <span>📅 {new Date(exam.start_time).toLocaleDateString()}</span>
                <span>❓ {exam.questions ? exam.questions.length : 0} questions</span>
              </div>
              
              {exam.visibility === 'private' && exam.shareable_token && (
                <div className="shareable-link-section">
                  <div className="link-header">
                    <strong>Shareable Link:</strong>
                    <button 
                      onClick={() => copyExamLink(exam)}
                      className={`copy-link-btn ${copiedToken === exam.id ? 'copied' : ''}`}
                    >
                      {copiedToken === exam.id ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <div className="link-preview">
                    <code>{getExamLink(exam)}</code>
                  </div>
                  <small className="link-help">
                    Share this link with students for private access
                  </small>
                </div>
              )}
              
              <div className="exam-actions">
                <button 
                  onClick={() => onExamSelect(exam)} 
                  className="btn-primary"
                >
                  {exam.status === 'draft' ? '✏️ Edit' : '👁️ View'}
                </button>
                
                {exam.status === 'draft' && (
                  <button 
                    onClick={() => deleteExam(exam.id)}
                    className="btn-danger"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
