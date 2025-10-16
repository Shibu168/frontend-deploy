import React, { useState, useEffect } from 'react';
import './ExamList.css';

const ExamList = ({ onExamSelect, refreshExams }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    duration_minutes: '',
    start_time: '',
    end_time: '',
    visibility: 'public',
    shared_emails: []
  });

  useEffect(() => {
    fetchExams();
  }, [refreshExams]);

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

  const unpublishExam = async (examId) => {
    if (window.confirm('Are you sure you want to unpublish this exam? Students will no longer be able to access it.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${examId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'draft'
          })
        });

        if (response.ok) {
          fetchExams();
          alert('Exam unpublished successfully');
        } else {
          alert('Failed to unpublish exam');
        }
      } catch (error) {
        console.error('Error unpublishing exam:', error);
        alert('Error unpublishing exam. Please try again.');
      }
    }
  };

  const startEditExam = (exam) => {
    setEditingExam(exam.id);
    setEditForm({
      title: exam.title,
      description: exam.description || '',
      duration_minutes: exam.duration_minutes,
      start_time: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '',
      end_time: exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '',
      visibility: exam.visibility || 'public',
      shared_emails: exam.shared_emails || []
    });
  };

  const cancelEdit = () => {
    setEditingExam(null);
    setEditForm({
      title: '',
      description: '',
      duration_minutes: '',
      start_time: '',
      end_time: '',
      visibility: 'public',
      shared_emails: []
    });
  };

  const updateExam = async (examId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedExam = await response.json();
        setExams(exams.map(exam => exam.id === examId ? updatedExam : exam));
        setEditingExam(null);
        alert('Exam updated successfully');
      } else {
        alert('Failed to update exam');
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Error updating exam. Please try again.');
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSharedEmailsChange = (emailsString) => {
    const emailsArray = emailsString.split(',').map(email => email.trim()).filter(email => email);
    setEditForm(prev => ({
      ...prev,
      shared_emails: emailsArray
    }));
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

  const canUnpublish = (exam) => {
    if (exam.status !== 'published') return false;
    const now = new Date();
    const endTime = new Date(exam.end_time);
    return now < endTime;
  };

  if (loading) {
    return (
      <div className="exam-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <div>
          <h1 className="exam-list-title">My Exams</h1>
          <p className="exam-list-subtitle">Manage and organize your exams</p>
        </div>
        <div className="exam-stats">
          <div className="stat-badge">
            <span className="stat-value">{exams.length}</span>
            <span className="stat-label">Total Exams</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{exams.filter(e => e.status === 'published').length}</span>
            <span className="stat-label">Published</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{exams.filter(e => e.status === 'draft').length}</span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="no-exams-container">
          <div className="no-exams-content">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2>No exams found</h2>
            <p>Create your first exam to get started!</p>
          </div>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam, index) => (
            <div
              key={exam.id}
              className="exam-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {editingExam === exam.id ? (
                <div className="exam-edit-form">
                  <div className="edit-form-header">
                    <h3>Edit Exam</h3>
                    <button onClick={cancelEdit} className="close-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => handleEditChange('title', e.target.value)}
                      className="form-input"
                      placeholder="Enter exam title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className="form-textarea"
                      placeholder="Enter exam description"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        value={editForm.duration_minutes}
                        onChange={(e) => handleEditChange('duration_minutes', e.target.value)}
                        className="form-input"
                        placeholder="60"
                      />
                    </div>

                    <div className="form-group">
                      <label>Visibility</label>
                      <select
                        value={editForm.visibility}
                        onChange={(e) => handleEditChange('visibility', e.target.value)}
                        className="form-select"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.start_time}
                        onChange={(e) => handleEditChange('start_time', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.end_time}
                        onChange={(e) => handleEditChange('end_time', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {editForm.visibility === 'shared' && (
                    <div className="form-group">
                      <label>Shared Emails</label>
                      <input
                        type="text"
                        value={editForm.shared_emails.join(', ')}
                        onChange={(e) => handleSharedEmailsChange(e.target.value)}
                        className="form-input"
                        placeholder="student1@example.com, student2@example.com"
                      />
                      <small className="form-help">Separate multiple emails with commas</small>
                    </div>
                  )}

                  <div className="edit-actions">
                    <button
                      onClick={() => updateExam(exam.id)}
                      className="btn-save"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="exam-card-header">
                    <div className="exam-title-section">
                      <h3 className="exam-title">{exam.title}</h3>
                      <div className="exam-badges">
                        <span className={`status-badge status-${exam.status}`}>
                          {exam.status === 'published' ? '🟢' : '🟡'} {exam.status}
                        </span>
                        <span className={`visibility-badge visibility-${exam.visibility}`}>
                          {exam.visibility === 'public' ? '🌐' : exam.visibility === 'private' ? '🔒' : '👥'} {exam.visibility}
                        </span>
                      </div>
                    </div>
                  </div>

                  {exam.description && (
                    <p className="exam-description">{exam.description}</p>
                  )}

                  <div className="exam-meta-grid">
                    <div className="meta-card">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <div>
                        <div className="meta-label">Duration</div>
                        <div className="meta-value">{exam.duration_minutes} min</div>
                      </div>
                    </div>

                    <div className="meta-card">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <div>
                        <div className="meta-label">Start Date</div>
                        <div className="meta-value">
                          {new Date(exam.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="meta-card">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                      <div>
                        <div className="meta-label">Questions</div>
                        <div className="meta-value">{exam.questions ? exam.questions.length : 0}</div>
                      </div>
                    </div>
                  </div>

                  {exam.visibility === 'private' && exam.shareable_token && (
                    <div className="shareable-link-section">
                      <div className="link-header">
                        <span className="link-title">Shareable Link</span>
                        <button
                          onClick={() => copyExamLink(exam)}
                          className={`copy-link-btn ${copiedToken === exam.id ? 'copied' : ''}`}
                        >
                          {copiedToken === exam.id ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                              Copy
                            </>
                          )}
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {exam.status === 'draft' ? (
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        ) : (
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" />
                        )}
                      </svg>
                      {exam.status === 'draft' ? 'Edit Questions' : 'View Details'}
                    </button>

                    <button
                      onClick={() => startEditExam(exam)}
                      className="btn-secondary"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
                      </svg>
                      Settings
                    </button>

                    {exam.status === 'draft' && (
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="btn-danger"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        Delete
                      </button>
                    )}

                    {exam.status === 'published' && canUnpublish(exam) && (
                      <button
                        onClick={() => unpublishExam(exam.id)}
                        className="btn-warning"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        </svg>
                        Unpublish
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
