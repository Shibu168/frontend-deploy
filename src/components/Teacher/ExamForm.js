import React, { useState } from 'react';
import './ExamForm.css';

const ExamForm = ({ onExamCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    domain_restriction: '',
    visibility: 'public',
    shared_emails: []
  });
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [createdExam, setCreatedExam] = useState(null);
  const [sharedEmailInput, setSharedEmailInput] = useState('');

  const convertToUTC = (localDateTimeString) => {
    if (!localDateTimeString) return '';
    const localDate = new Date(localDateTimeString);
    return localDate.toISOString();
  };

  const displayUTCinIST = (utcTimeString) => {
    if (!utcTimeString) return '';
    const date = new Date(utcTimeString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddEmail = () => {
    if (sharedEmailInput && !formData.shared_emails.includes(sharedEmailInput)) {
      setFormData({
        ...formData,
        shared_emails: [...formData.shared_emails, sharedEmailInput]
      });
      setSharedEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      shared_emails: formData.shared_emails.filter(email => email !== emailToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;

      const payload = {
        ...formData,
        start_time: convertToUTC(formData.start_time),
        end_time: convertToUTC(formData.end_time)
      };

      console.log('Debug - Time conversion:', {
        localStart: formData.start_time,
        utcStart: payload.start_time,
        localEnd: formData.end_time,
        utcEnd: payload.end_time
      });

      const response = await fetch(`${API_BASE}/api/teacher/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const exam = await response.json();
        setCreatedExam(exam);

        console.log('Exam created:', exam);

        if (formData.visibility === 'private' && exam.shareable_token) {
          const fullLink = `${window.location.origin}/exam/${exam.shareable_token}`;
          setGeneratedLink(fullLink);
        } else {
          alert('Exam created successfully!');
          onExamCreated(exam);

          setFormData({
            title: '',
            description: '',
            start_time: '',
            end_time: '',
            duration_minutes: 60,
            domain_restriction: '',
            visibility: 'public',
            shared_emails: []
          });
        }
      } else {
        const errorData = await response.json();
        alert('Failed to create exam: ' + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error creating exam. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Exam link copied to clipboard!');
  };

  const createNewExam = () => {
    setGeneratedLink('');
    setCreatedExam(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60,
      domain_restriction: '',
      visibility: 'public',
      shared_emails: []
    });
    setSharedEmailInput('');
  };

  const viewExamDetails = () => {
    if (createdExam) {
      onExamCreated(createdExam);
    }
  };

  return (
    <div className="exam-form-container">
      <div className="exam-form-header">
        <h1 className="form-title">Create New Exam</h1>
        <p className="form-subtitle">Set up your exam details and preferences</p>
      </div>

      {!generatedLink ? (
        <div className="form-card">
          <div className="timezone-banner">
            <div className="banner-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="banner-content">
              <strong>Timezone Information</strong>
              <p>Times should be entered in your local time. They will be automatically converted to UTC for the server.</p>
              {formData.start_time && (
                <div className="timezone-details">
                  <p><strong>Your local time:</strong> {new Date(formData.start_time).toLocaleString()}</p>
                  <p><strong>Server will receive (UTC):</strong> {convertToUTC(formData.start_time)}</p>
                  <p><strong>This equals (IST):</strong> {displayUTCinIST(convertToUTC(formData.start_time))} IST</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="exam-form">
            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                </svg>
                Exam Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter exam description"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Start Time (Your Local Time) *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  End Time (Your Local Time) *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="60"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Domain Restriction
                </label>
                <input
                  type="text"
                  name="domain_restriction"
                  value={formData.domain_restriction}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="example.com"
                />
                <small className="form-help">Only students with emails from this domain can take the exam</small>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Visibility *
              </label>
              <div className="visibility-options">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleChange}
                  />
                  <div className="radio-card-content">
                    <div className="radio-icon">🌐</div>
                    <div>
                      <strong>Public</strong>
                      <p>Visible in student dashboard</p>
                    </div>
                  </div>
                </label>

                <label className="radio-card">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleChange}
                  />
                  <div className="radio-card-content">
                    <div className="radio-icon">🔒</div>
                    <div>
                      <strong>Private</strong>
                      <p>Access by link only</p>
                    </div>
                  </div>
                </label>

                <label className="radio-card">
                  <input
                    type="radio"
                    name="visibility"
                    value="shared"
                    checked={formData.visibility === 'shared'}
                    onChange={handleChange}
                  />
                  <div className="radio-card-content">
                    <div className="radio-icon">👥</div>
                    <div>
                      <strong>Shared</strong>
                      <p>Specific students by email</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {formData.visibility === 'shared' && (
              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                  Share with Students (Emails) *
                </label>
                <div className="email-input-container">
                  <input
                    type="email"
                    value={sharedEmailInput}
                    onChange={(e) => setSharedEmailInput(e.target.value)}
                    className="form-input"
                    placeholder="Enter student email"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                  />
                  <button type="button" onClick={handleAddEmail} className="add-email-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add
                  </button>
                </div>
                <div className="email-tags">
                  {formData.shared_emails.map((email, index) => (
                    <div key={index} className="email-tag">
                      <span>{email}</span>
                      <button type="button" onClick={() => handleRemoveEmail(email)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {formData.shared_emails.length === 0 && (
                  <p className="warning-text">Please add at least one student email</p>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || (formData.visibility === 'shared' && formData.shared_emails.length === 0)}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    Create Exam
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h2>Private Exam Created Successfully!</h2>
            <p>Share this unique link with your students:</p>

            <div className="link-container">
              <div className="link-display">
                <code>{generatedLink}</code>
              </div>
              <button onClick={copyToClipboard} className="copy-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Link
              </button>
            </div>

            <div className="exam-details">
              <h3>Exam Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">📝</div>
                  <div>
                    <div className="detail-label">Title</div>
                    <div className="detail-value">{createdExam?.title}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">⏱️</div>
                  <div>
                    <div className="detail-label">Duration</div>
                    <div className="detail-value">{createdExam?.duration_minutes} minutes</div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">🚀</div>
                  <div>
                    <div className="detail-label">Starts (IST)</div>
                    <div className="detail-value">{displayUTCinIST(createdExam?.start_time)}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">🏁</div>
                  <div>
                    <div className="detail-label">Ends (IST)</div>
                    <div className="detail-value">{displayUTCinIST(createdExam?.end_time)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="success-actions">
              <button onClick={createNewExam} className="btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Another Exam
              </button>
              <button onClick={viewExamDetails} className="btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View Exam Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamForm;
