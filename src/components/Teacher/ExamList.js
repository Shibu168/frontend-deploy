import React, { useState, useEffect } from 'react';
import './ExamList.css'; // We'll create this CSS file

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
          // Refresh exams list
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
              {editingExam === exam.id ? (
                <div className="exam-edit-form">
                  <h3>Edit Exam</h3>
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => handleEditChange('title', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className="form-textarea"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (minutes):</label>
                      <input
                        type="number"
                        value={editForm.duration_minutes}
                        onChange={(e) => handleEditChange('duration_minutes', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Visibility:</label>
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
                      <label>Start Time:</label>
                      <input
                        type="datetime-local"
                        value={editForm.start_time}
                        onChange={(e) => handleEditChange('start_time', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>End Time:</label>
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
                      <label>Shared Emails (comma-separated):</label>
                      <input
                        type="text"
                        value={editForm.shared_emails.join(', ')}
                        onChange={(e) => handleSharedEmailsChange(e.target.value)}
                        className="form-input"
                        placeholder="student1@example.com, student2@example.com"
                      />
                    </div>
                  )}
                  
                  <div className="edit-actions">
                    <button 
                      onClick={() => updateExam(exam.id)}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="exam-header">
                    <h3>{exam.title}</h3>
                    <div className="exam-badges">
                      <span className={`status-badge ${exam.status}`}>
                        {exam.status}
                      </span>
                      <span className={`visibility-badge ${exam.visibility}`}>
                        {exam.visibility}
                      </span>
                    </div>
                  </div>
                  
                  <p className="exam-description">{exam.description}</p>
                  
                  <div className="exam-meta">
                    <span className="meta-item">⏱️ {exam.duration_minutes} min</span>
                    <span className="meta-item">
                      📅 {new Date(exam.start_time).toLocaleDateString()} 
                      {new Date(exam.start_time).toLocaleTimeString()}
                    </span>
                    <span className="meta-item">
                      ❓ {exam.questions ? exam.questions.length : 0} questions
                    </span>
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
                      {exam.status === 'draft' ? '✏️ Edit Questions' : '👁️ View Details'}
                    </button>
                    
                    <button 
                      onClick={() => startEditExam(exam)}
                      className="btn-secondary"
                    >
                      ⚙️ Edit Exam
                    </button>
                    
                    {exam.status === 'draft' && (
                      <button 
                        onClick={() => deleteExam(exam.id)}
                        className="btn-danger"
                      >
                        🗑️ Delete
                      </button>
                    )}
                    
                    {exam.status === 'published' && canUnpublish(exam) && (
                      <button 
                        onClick={() => unpublishExam(exam.id)}
                        className="btn-warning"
                      >
                        📝 Unpublish
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