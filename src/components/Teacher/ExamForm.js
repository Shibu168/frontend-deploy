import React, { useState } from 'react';

const ExamForm = ({ onExamCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    domain_restriction: '',
    visibility: 'public'
  });
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [createdExam, setCreatedExam] = useState(null);

  // Function to convert IST to UTC
  const convertISTtoUTC = (istDateTimeString) => {
    if (!istDateTimeString) return '';
    
    // Create date object from IST time (assuming input is in IST)
    const istDate = new Date(istDateTimeString);
    
    // Convert to UTC by subtracting 5 hours 30 minutes
    const utcDate = new Date(istDate.getTime() - (5 * 60 + 30) * 60 * 1000);
    
    return utcDate.toISOString();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      
      // Convert IST times to UTC before sending
      const payload = {
        ...formData,
        start_time: convertISTtoUTC(formData.start_time),
        end_time: convertISTtoUTC(formData.end_time)
      };

      console.log('Sending payload:', payload); // Debug log

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
        
        console.log('Exam created:', exam); // Debug log
        
        // Show generated link if exam is private
        if (formData.visibility === 'private' && exam.shareable_token) {
          const fullLink = `${window.location.origin}/exam/${exam.shareable_token}`;
          setGeneratedLink(fullLink);
        } else {
          alert('Exam created successfully!');
          onExamCreated(exam);
          
          // Reset form for public exams
          setFormData({
            title: '',
            description: '',
            start_time: '',
            end_time: '',
            duration_minutes: 60,
            domain_restriction: '',
            visibility: 'public'
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
      visibility: 'public'
    });
  };

  const viewExamDetails = () => {
    if (createdExam) {
      onExamCreated(createdExam);
    }
  };

  // Helper to display time in IST for user feedback
  const displayTimeInIST = (utcTimeString) => {
    if (!utcTimeString) return '';
    const date = new Date(utcTimeString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  return (
    <div className="exam-form">
      <h2>Create New Exam</h2>
      
      {/* Timezone Info Banner */}
      <div className="timezone-info" style={{
        backgroundColor: '#e3f2fd',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #90caf9'
      }}>
        <strong>⏰ Timezone Information:</strong> 
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
          Times should be entered in <strong>Indian Standard Time (IST)</strong>. 
          They will be automatically converted to UTC for the server.
        </p>
        {formData.start_time && (
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
            Your start time: {displayTimeInIST(convertISTtoUTC(formData.start_time))} IST
          </p>
        )}
      </div>
      
      {!generatedLink ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exam Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Start Time (IST) *</label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
            {formData.start_time && (
              <small style={{ color: '#666' }}>
                Server will receive: {convertISTtoUTC(formData.start_time)}
              </small>
            )}
          </div>
          
          <div className="form-group">
            <label>End Time (IST) *</label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
            />
            {formData.end_time && (
              <small style={{ color: '#666' }}>
                Server will receive: {convertISTtoUTC(formData.end_time)}
              </small>
            )}
          </div>
          
          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Domain Restriction (optional)</label>
            <input
              type="text"
              name="domain_restriction"
              value={formData.domain_restriction}
              onChange={handleChange}
              placeholder="example.com"
            />
            <small>Only students with emails from this domain will be able to take the exam</small>
          </div>
          
          <div className="form-group">
            <label>Visibility *</label>
            <div className="visibility-options">
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleChange}
                />
                Public (Visible in student dashboard)
              </label>
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                />
                Private (Access by link only)
              </label>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      ) : (
        <div className="exam-link-generated">
          <div className="success-message">
            <h3>✅ Private Exam Created Successfully!</h3>
            <p>Share this unique link with your students:</p>
            
            <div className="link-container">
              <input 
                type="text" 
                value={generatedLink} 
                readOnly 
                className="generated-link-input"
              />
              <button onClick={copyToClipboard} className="copy-btn">
                Copy Link
              </button>
            </div>
            
            <div className="exam-info">
              <h4>Exam Details:</h4>
              <p><strong>Title:</strong> {createdExam?.title}</p>
              <p><strong>Duration:</strong> {createdExam?.duration_minutes} minutes</p>
              <p><strong>Starts (IST):</strong> {displayTimeInIST(createdExam?.start_time)}</p>
              <p><strong>Ends (IST):</strong> {displayTimeInIST(createdExam?.end_time)}</p>
            </div>
            
            <div className="link-actions">
              <button onClick={createNewExam} className="btn btn-secondary">
                Create Another Exam
              </button>
              <button onClick={viewExamDetails} className="btn btn-primary">
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