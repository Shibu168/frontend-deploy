import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import './ExamEditForm.css';

const ExamEditForm = ({ exam, onExamUpdated, onBack, onNotification }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    start_time: '',
    end_time: '',
    visibility: 'public',
    shared_emails: [],
    instructions: '',
    passing_marks: 40,
    max_attempts: 1,
    status: 'draft'
  });
  
  const [newSharedEmail, setNewSharedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (exam) {
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        duration: exam.duration || 60,
        start_time: formatDateForInput(exam.start_time),
        end_time: formatDateForInput(exam.end_time),
        visibility: exam.visibility || 'public',
        shared_emails: exam.shared_emails || [],
        instructions: exam.instructions || '',
        passing_marks: exam.passing_marks || 40,
        max_attempts: exam.max_attempts || 1,
        status: exam.status || 'draft'
      });
    }
  }, [exam]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleAddSharedEmail = () => {
    if (newSharedEmail && !formData.shared_emails.includes(newSharedEmail)) {
      setFormData(prev => ({
        ...prev,
        shared_emails: [...prev.shared_emails, newSharedEmail.trim().toLowerCase()]
      }));
      setNewSharedEmail('');
      if (onNotification) {
        onNotification('Email added to shared list', 'success');
      }
    } else if (onNotification) {
      onNotification('Email already exists in shared list', 'warning');
    }
  };

  const handleRemoveSharedEmail = (email) => {
    setFormData(prev => ({
      ...prev,
      shared_emails: prev.shared_emails.filter(e => e !== email)
    }));
    if (onNotification) {
      onNotification('Email removed from shared list', 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    if (onNotification) {
      onNotification('Updating exam...', 'info');
    }
    
    try {
      const token = await auth.currentUser.getIdToken();
      
      // Prepare data for API - CHANGED FROM PATCH TO PUT
      const submitData = {
        ...formData,
        // Convert shared_emails array for API
        shared_emails: formData.visibility === 'shared' ? formData.shared_emails : []
      };

      console.log('Sending PUT request to:', `${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${exam.id}`);
      console.log('Request data:', submitData);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${exam.id}`, {
        method: 'PUT', // CHANGED FROM PATCH TO PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to update exam: ${response.status} ${response.statusText}`);
      }

      const updatedExam = await response.json();
      const successMsg = 'Exam updated successfully!';
      setMessage(successMsg);
      setMessageType('success');
      
      if (onNotification) {
        onNotification(successMsg, 'success');
      }
      
      onExamUpdated(updatedExam);
      
    } catch (error) {
      console.error('Error updating exam:', error);
      const errorMsg = 'Error updating exam: ' + error.message;
      setMessage(errorMsg);
      setMessageType('error');
      
      if (onNotification) {
        onNotification(errorMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityChange = (visibility) => {
    setFormData(prev => ({
      ...prev,
      visibility
    }));
    
    if (onNotification) {
      onNotification(`Visibility changed to: ${visibility}`, 'info');
    }
  };

  const copyShareableToken = async () => {
    if (exam.shareable_token) {
      try {
        await navigator.clipboard.writeText(exam.shareable_token);
        const successMsg = 'Shareable token copied to clipboard!';
        setMessage(successMsg);
        setMessageType('success');
        
        if (onNotification) {
          onNotification(successMsg, 'success');
        }
        
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        const errorMsg = 'Failed to copy token';
        setMessage(errorMsg);
        setMessageType('error');
        
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSharedEmail();
    }
  };

  if (!exam) {
    return (
      <div className="exam-edit-form">
        <div className="error-message">No exam selected</div>
      </div>
    );
  }

  return (
    <div className="exam-edit-form">
      <div className="edit-form-header">
        <button onClick={onBack} className="back-button">
          ← Back to Exams
        </button>
        <h2>Edit Exam: {exam.title}</h2>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Exam Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows="3"
              placeholder="Provide instructions for students..."
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Timing & Duration</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">Start Time</label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time">End Time</label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_attempts">Max Attempts</label>
              <input
                type="number"
                id="max_attempts"
                name="max_attempts"
                value={formData.max_attempts}
                onChange={handleInputChange}
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Grading & Settings</h3>
          
          <div className="form-group">
            <label htmlFor="passing_marks">Passing Marks (%)</label>
            <input
              type="number"
              id="passing_marks"
              name="passing_marks"
              value={formData.passing_marks}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Exam Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Visibility Settings</h3>
          
          <div className="visibility-options">
            <div className="visibility-option">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={formData.visibility === 'public'}
                onChange={() => handleVisibilityChange('public')}
              />
              <label htmlFor="public">
                <strong>Public</strong>
                <span>Anyone with the link can access</span>
              </label>
            </div>

            <div className="visibility-option">
              <input
                type="radio"
                id="private"
                name="visibility"
                checked={formData.visibility === 'private'}
                onChange={() => handleVisibilityChange('private')}
              />
              <label htmlFor="private">
                <strong>Private</strong>
                <span>Only people with the secret token can access</span>
                {exam.shareable_token && formData.visibility === 'private' && (
                  <div className="token-section">
                    <p>Shareable Token:</p>
                    <div className="token-display">
                      <code>{exam.shareable_token}</code>
                      <button type="button" onClick={copyShareableToken} className="copy-token-btn">
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div className="visibility-option">
              <input
                type="radio"
                id="shared"
                name="visibility"
                checked={formData.visibility === 'shared'}
                onChange={() => handleVisibilityChange('shared')}
              />
              <label htmlFor="shared">
                <strong>Shared with Specific Students</strong>
                <span>Only selected students can access</span>
              </label>
            </div>
          </div>

          {formData.visibility === 'shared' && (
            <div className="shared-emails-section">
              <label>Add Student Emails:</label>
              <div className="email-input-group">
                <input
                  type="email"
                  value={newSharedEmail}
                  onChange={(e) => setNewSharedEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter student email"
                  className="email-input"
                />
                <button type="button" onClick={handleAddSharedEmail} className="add-email-btn">
                  Add
                </button>
              </div>
              
              {formData.shared_emails.length > 0 && (
                <div className="email-list">
                  <h4>Shared With ({formData.shared_emails.length}):</h4>
                  {formData.shared_emails.map((email, index) => (
                    <div key={index} className="email-item">
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSharedEmail(email)}
                        className="remove-email-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onBack}
            className="cancel-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamEditForm;