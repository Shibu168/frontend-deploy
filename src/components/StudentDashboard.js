import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import AvailableExams from './Student/AvailableExams';
import ExamInterface from './Student/ExamInterface';
import Results from './Student/Results';
import PrivateExamAccess from './Student/PrivateExamAccess';
import './StudentDashboard.css';

const StudentDashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeView, setActiveView] = useState('exams');
  const [securityStatus, setSecurityStatus] = useState('secure');
  const [systemStatus, setSystemStatus] = useState('online');
  const [proctorStatus, setProctorStatus] = useState('active');
  const [notifications, setNotifications] = useState([]);

  // Notification system
  const showNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Enhanced error handling
  const handleApiError = (error, context = 'Operation') => {
    console.error(`${context}:`, error);
    const errorMessage = error.message || `Failed to ${context.toLowerCase()}`;
    showNotification(`${context} failed: ${errorMessage}`, 'error');
  };

  const handleSuccess = (message) => {
    showNotification(message, 'success');
  };

  const handleInfo = (message) => {
    showNotification(message, 'info');
  };

  // Security status animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStatus(prev => prev === 'secure' ? 'scanning' : 'secure');
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // System status simulation
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setSystemStatus('online');
      setProctorStatus('active');
    }, 5000);
    
    return () => clearInterval(statusInterval);
  }, []);

  // Check if we're coming from a private exam link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      navigate(`/exam/${token}`);
      return;
    }

    if (location.state && location.state.privateExam) {
      setSelectedExam(location.state.privateExam);
      window.history.replaceState({}, document.title);
      handleInfo('Private exam loaded successfully');
    }
  }, [location.state, navigate]);

  const handleLogout = async () => {
    try {
      showNotification('Logging out...', 'info');
      await signOut(auth);
      handleSuccess('Logged out successfully');
      setTimeout(() => {
        if (onLogout) {
          onLogout();
        }
        navigate('/');
      }, 1000);
    } catch (error) {
      handleApiError(error, 'Logout');
    }
  };

  const handleExamSelect = (examData) => {
    console.log('Exam selected in dashboard:', examData);
    
    if (examData && examData.id && Array.isArray(examData.questions)) {
      setSelectedExam(examData);
      handleInfo(`Starting exam: ${examData.title}`);
    } else {
      console.error('Invalid exam data structure:', examData);
      handleApiError(new Error('Invalid exam data structure'), 'Loading exam');
    }
  };

  const handleExamComplete = () => {
    setSelectedExam(null);
    setActiveView('results');
    handleSuccess('Exam completed successfully! Viewing results...');
  };

  const handleBackToDashboard = () => {
    setSelectedExam(null);
    handleInfo('Returned to dashboard');
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    switch(view) {
      case 'exams':
        handleInfo('Viewing available exams');
        break;
      case 'results':
        handleInfo('Viewing exam results');
        break;
      case 'analytics':
        handleInfo('Viewing performance analytics');
        break;
      default:
        break;
    }
  };

  // Get user display name or email
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Student';
  };

  // Get user photo URL or use default avatar
  const getUserPhotoURL = () => {
    return user?.photoURL || null;
  };

  // If we have a selected exam, show the exam interface
  if (selectedExam) {
    return (
      <ExamInterface 
        exam={selectedExam}
        onExamComplete={handleExamComplete}
        onBack={handleBackToDashboard}
        onNotification={showNotification}
      />
    );
  }

  return (
    <div className="student-dashboard">
      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            {notification.message}
          </div>
        ))}
      </div>
      
      {/* Security Status Bar */}
      <div className="security-bar">
        <div className="security-indicators">
          <div className={`security-indicator ${securityStatus}`}></div>
          <span className="security-text">Secure Session Active</span>
          <div className="status-badges">
            <span className={`status-badge ${systemStatus}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 14S9.5 16 12 16S16 14 16 14" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9H9.01M15 9H15.01" stroke="currentColor" strokeWidth="2"/>
              </svg>
              System {systemStatus}
            </span>
            <span className={`status-badge ${proctorStatus}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Proctoring {proctorStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="student-header">
        <div className="header-content">
          <div className="header-left">
            <div className="dashboard-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 15L12 18M12 18L9 21M12 18L15 21" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="4" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M7 8H17" stroke="currentColor" strokeWidth="2.5"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <div className="header-text">
              <h1>Examination Center</h1>
              <p>Secure Testing Environment</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {getUserPhotoURL() ? (
                  <img 
                    src={getUserPhotoURL()} 
                    alt={getUserDisplayName()}
                    className="user-avatar-img"
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{getUserDisplayName()}</span>
                <span className="user-role">Student</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9" stroke="currentColor" strokeWidth="2"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Secure Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="student-nav">
        <div className="nav-container">
          <button 
            className={`nav-btn ${activeView === 'exams' ? 'active' : ''}`}
            onClick={() => handleViewChange('exams')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14L16 14M8 18L12 18" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
            </svg>
            <span>Available Exams</span>
            <div className="nav-indicator"></div>
          </button>
          
          <button 
            className={`nav-btn ${activeView === 'results' ? 'active' : ''}`}
            onClick={() => handleViewChange('results')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3V21L12 17L21 21V3H3Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9L15 9M9 13L13 13" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
            </svg>
            <span>My Results</span>
            <div className="nav-indicator"></div>
          </button>
          
          <button 
            className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleViewChange('analytics')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9L12 6L16 10L20 6" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="20" cy="6" r="2" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            </svg>
            <span>Performance Analytics</span>
            <div className="nav-indicator"></div>
          </button>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="student-content">
        <div className="content-container">
          {activeView === 'exams' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Available Examinations</h2>
                <p>Select an examination to begin your secure testing session</p>
              </div>
              <AvailableExams onExamSelect={handleExamSelect} onNotification={showNotification} />
            </div>
          )}
          
          {activeView === 'results' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Examination Results</h2>
                <p>Review your performance and detailed analytics</p>
              </div>
              <Results onNotification={showNotification} />
            </div>
          )}
          
          {activeView === 'analytics' && (
            <div className="content-section">
              <div className="section-header">
                <h2>Performance Analytics</h2>
                <p>Comprehensive analysis of your examination performance</p>
              </div>
              <div className="analytics-placeholder">
                <div className="analytics-card">
                  <div className="analytics-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 9L12 6L16 10L20 6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>Performance Tracking</h3>
                  <p>Detailed analytics and progress tracking will be available here.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="student-footer">
        <div className="footer-content">
          <div className="footer-security">
            <span className="security-badge">🔐 End-to-End Encrypted</span>
            <span className="security-badge">🛡️ FERPA Compliant</span>
            <span className="security-badge">⚡ Real-time Monitoring</span>
          </div>
          <div className="footer-info">
            <p>Secure examination environment powered by ExamNest</p>
          </div>
        </div>
      </footer>

      {/* Add CSS for notifications */}
      <style>
        {`
          .notification-container {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
          }

          .notification {
            padding: 15px 20px;
            border-radius: 12px;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(14, 165, 233, 0.2);
            box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1) inset;
            color: #0f172a;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            animation: notificationSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 350px;
            word-wrap: break-word;
            cursor: pointer;
          }

          .notification-success {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
          }

          .notification-error {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
          }

          .notification-info {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
          }

          @keyframes notificationSlide {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }

          /* Dark theme support */
          @media (prefers-color-scheme: dark) {
            .notification {
              background: rgba(15, 23, 42, 0.95);
              border: 2px solid rgba(0, 255, 150, 0.2);
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 150, 0.1) inset;
              color: #f8fafc;
            }

            .notification-success {
              background: rgba(16, 185, 129, 0.15);
              border-color: rgba(16, 185, 129, 0.4);
            }

            .notification-error {
              background: rgba(239, 68, 68, 0.15);
              border-color: rgba(239, 68, 68, 0.4);
            }

            .notification-info {
              background: rgba(59, 130, 246, 0.15);
              border-color: rgba(59, 130, 246, 0.4);
            }
          }
        `}
      </style>
    </div>
  );
};

export default StudentDashboard;