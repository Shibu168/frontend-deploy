import React, { useState, useEffect } from 'react';
import './ExamList.css';

const ExamList = ({ onExamSelect, onEditExam }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

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
      } else {
        console.error('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(examId);
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Error deleting exam. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const copyExamLink = (exam) => {
    if (exam.visibility === 'private' && exam.shareable_token) {
      const examLink = `${window.location.origin}/exam/${exam.shareable_token}`;
      navigator.clipboard.writeText(examLink).then(() => {
        setCopiedToken(exam.id);
        setTimeout(() => setCopiedToken(null), 3000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const copyToken = (exam) => {
    if (exam.shareable_token) {
      navigator.clipboard.writeText(exam.shareable_token).then(() => {
        setCopiedToken(exam.id);
        setTimeout(() => setCopiedToken(null), 3000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const getExamLink = (exam) => {
    if (exam.visibility === 'private' && exam.shareable_token) {
      return `${window.location.origin}/exam/${exam.shareable_token}`;
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m left`;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'secondary';
      default: return 'default';
    }
  };

  const getVisibilityBadgeVariant = (visibility) => {
    switch (visibility) {
      case 'public': return 'primary';
      case 'private': return 'info';
      case 'shared': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="exam-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading your exams...</p>
      </div>
    );
  }

  return (
    <div className="teacher-exam-list">
      <div className="exam-list-header">
        <h2>My Exams</h2>
        <div className="exam-stats">
          <span className="stat-item">
            <strong>{exams.length}</strong> total
          </span>
          <span className="stat-item">
            <strong>{exams.filter(e => e.status === 'published').length}</strong> published
          </span>
          <span className="stat-item">
            <strong>{exams.filter(e => e.status === 'draft').length}</strong> draft
          </span>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="no-exams">
          <div className="no-exams-icon">📝</div>
          <h3>No exams created yet</h3>
          <p>Create your first exam to get started with managing assessments</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <div className="exam-card-header">
                <div className="exam-title-section">
                  <h3 className="exam-title">{exam.title}</h3>
                  <div className="exam-badges">
                    <span className={`status-badge ${getStatusBadgeVariant(exam.status)}`}>
                      {exam.status}
                    </span>
                    <span className={`visibility-badge ${getVisibilityBadgeVariant(exam.visibility)}`}>
                      {exam.visibility}
                    </span>
                  </div>
                </div>
                <div className="exam-actions-dropdown">
                  <button className="dropdown-toggle">⋯</button>
                  <div className="dropdown-menu">
                    <button 
                      onClick={() => onEditExam && onEditExam(exam)}
                      className="dropdown-item"
                    >
                      <span className="icon">✏️</span>
                      Edit Exam
                    </button>
                    <button 
                      onClick={() => onExamSelect && onExamSelect(exam)}
                      className="dropdown-item"
                    >
                      <span className="icon">❓</span>
                      Manage Questions
                    </button>
                    {exam.status === 'published' && (
                      <button 
                        onClick={() => {/* Navigate to results */}}
                        className="dropdown-item"
                      >
                        <span className="icon">📊</span>
                        View Results
                      </button>
                    )}
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={() => deleteExam(exam.id)}
                      disabled={deleteLoading === exam.id}
                      className="dropdown-item delete"
                    >
                      <span className="icon">
                        {deleteLoading === exam.id ? '⏳' : '🗑️'}
                      </span>
                      {deleteLoading === exam.id ? 'Deleting...' : 'Delete Exam'}
                    </button>
                  </div>
                </div>
              </div>
              
              {exam.description && (
                <p className="exam-description">{exam.description}</p>
              )}
              
              <div className="exam-meta-grid">
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <div className="meta-content">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{exam.duration} minutes</span>
                  </div>
                </div>
                
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <div className="meta-content">
                    <span className="meta-label">Starts</span>
                    <span className="meta-value">{formatDate(exam.start_time)}</span>
                  </div>
                </div>
                
                <div className="meta-item">
                  <span className="meta-icon">⏰</span>
                  <div className="meta-content">
                    <span className="meta-label">Ends</span>
                    <span className="meta-value">{formatDate(exam.end_time)}</span>
                  </div>
                </div>
                
                <div className="meta-item">
                  <span className="meta-icon">❓</span>
                  <div className="meta-content">
                    <span className="meta-label">Questions</span>
                    <span className="meta-value">
                      {exam.questions ? exam.questions.length : 0}
                    </span>
                  </div>
                </div>
              </div>

              {exam.end_time && (
                <div className="time-remaining">
                  <span className={`time-badge ${getTimeRemaining(exam.end_time) === 'Expired' ? 'expired' : ''}`}>
                    {getTimeRemaining(exam.end_time)}
                  </span>
                </div>
              )}

              {exam.visibility === 'private' && exam.shareable_token && (
                <div className="shareable-link-section">
                  <div className="link-header">
                    <strong>Private Exam Link</strong>
                    <div className="link-actions">
                      <button 
                        onClick={() => copyExamLink(exam)}
                        className={`copy-btn ${copiedToken === exam.id ? 'copied' : ''}`}
                      >
                        {copiedToken === exam.id ? '✓ Copied' : 'Copy Link'}
                      </button>
                      <button 
                        onClick={() => copyToken(exam)}
                        className="copy-token-btn"
                        title="Copy token only"
                      >
                        Copy Token
                      </button>
                    </div>
                  </div>
                  <div className="link-preview">
                    <code>{getExamLink(exam)}</code>
                  </div>
                </div>
              )}

              {exam.visibility === 'shared' && exam.shared_emails && (
                <div className="shared-emails-section">
                  <div className="shared-header">
                    <strong>Shared with {exam.shared_emails.length} student(s)</strong>
                  </div>
                  <div className="email-list-preview">
                    {exam.shared_emails.slice(0, 3).map((email, index) => (
                      <span key={index} className="email-tag">{email}</span>
                    ))}
                    {exam.shared_emails.length > 3 && (
                      <span className="email-more">+{exam.shared_emails.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="exam-card-actions">
                <button 
                  onClick={() => onEditExam && onEditExam(exam)}
                  className="btn-primary"
                >
                  <span className="btn-icon">✏️</span>
                  Edit Exam
                </button>
                
                <button 
                  onClick={() => onExamSelect && onExamSelect(exam)}
                  className="btn-secondary"
                >
                  <span className="btn-icon">❓</span>
                  Questions
                </button>
                
                {exam.status === 'published' && (
                  <button 
                    onClick={() => {/* Navigate to results */}}
                    className="btn-success"
                  >
                    <span className="btn-icon">📊</span>
                    Results
                  </button>
                )}
                
                {exam.status === 'draft' && (
                  <button 
                    onClick={() => deleteExam(exam.id)}
                    disabled={deleteLoading === exam.id}
                    className="btn-danger"
                  >
                    <span className="btn-icon">
                      {deleteLoading === exam.id ? '⏳' : '🗑️'}
                    </span>
                    {deleteLoading === exam.id ? 'Deleting...' : 'Delete'}
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