import React, { useState, useEffect } from 'react';
import './Register.css';

const Register = ({ userInfo, onRegister }) => {
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityStatus, setSecurityStatus] = useState('secure');
  const [selectedCard, setSelectedCard] = useState(null);

  // Security status animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStatus(prev => prev === 'secure' ? 'scanning' : 'secure');
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        onRegister(role);
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setSelectedCard(selectedRole);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Security Indicator */}
        <div className={`security-indicator ${securityStatus}`}></div>
        
        {/* Header */}
        <div className="register-header">
          <div className="register-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19A4 4 0 0 0 12 15H5A4 4 0 0 0 1 19V21" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19A4 4 0 0 0 16 15" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 3.13A4 4 0 0 1 16 11" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            </svg>
          </div>
          <h2>Complete Registration</h2>
          <p>Secure role-based access configuration</p>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="user-info">
            <div className="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="user-details">
              <h3>{userInfo.name}</h3>
              <p>{userInfo.email}</p>
              <span className="verification-badge">
                ✅ Email Verified
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-section">
            <label className="section-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 15L12 18M12 18L9 21M12 18L15 21" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2"/>
                <rect x="4" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 8H17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Select Your Role in ExamNest
            </label>
            
            <div className="role-selection">
              {/* Student Role */}
              <div 
                className={`role-card ${role === 'student' ? 'selected' : ''} ${selectedCard === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('student')}
              >
                <input
                  type="radio"
                  value="student"
                  checked={role === 'student'}
                  onChange={() => handleRoleSelect('student')}
                  className="role-input"
                />
                <div className="role-icon student-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M22 10V6L12 2L2 6V10L12 14L22 10Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 12L12 16L18 12" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 17L12 21L22 17" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
                  </svg>
                </div>
                <div className="role-content">
                  <h4>Student</h4>
                  <p>Take examinations, view results, track progress</p>
                  <div className="role-features">
                    <span>📚 Access Exams</span>
                    <span>📊 View Analytics</span>
                    <span>🎯 Track Performance</span>
                  </div>
                </div>
                <div className="role-indicator">
                  <div className="check-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Teacher Role */}
              <div 
                className={`role-card ${role === 'teacher' ? 'selected' : ''} ${selectedCard === 'teacher' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('teacher')}
              >
                <input
                  type="radio"
                  value="teacher"
                  checked={role === 'teacher'}
                  onChange={() => handleRoleSelect('teacher')}
                  className="role-input"
                />
                <div className="role-icon teacher-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 14H16" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
                    <path d="M8 18H12" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
                  </svg>
                </div>
                <div className="role-content">
                  <h4>Teacher</h4>
                  <p>Create exams, manage students, analyze performance</p>
                  <div className="role-features">
                    <span>✏️ Create Exams</span>
                    <span>👥 Manage Classes</span>
                    <span>📈 Advanced Analytics</span>
                  </div>
                </div>
                <div className="role-indicator">
                  <div className="check-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={!role || isSubmitting}
            className="register-submit-btn"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                Configuring Access...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12L18 8V11H3V13H18V16L22 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Complete Secure Registration
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="security-footer">
          <div className="security-info">
            <span className="security-badge">🔐 Role-Based Access</span>
            <span className="security-badge">🛡️ RBAC Protected</span>
            <span className="security-badge">⚡ Instant Setup</span>
          </div>
          <p className="security-note">
            Your role determines access permissions and available features within the platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;