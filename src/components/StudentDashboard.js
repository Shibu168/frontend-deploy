import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import AvailableExams from './Student/AvailableExams';
import ExamInterface from './Student/ExamInterface';
import Results from './Student/Results';
import PrivateExamAccess from './Student/PrivateExamAccess';
import { BookOpen, Calendar, Award, MessageCircle, Bell, User, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Show splash screen on component mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
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
    }
  }, [location.state, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) {
        onLogout();
      }
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleExamSelect = (examData) => {
    console.log('Exam selected in dashboard:', examData);
    
    if (examData && examData.id && Array.isArray(examData.questions)) {
      setSelectedExam(examData);
    } else {
      console.error('Invalid exam data structure:', examData);
      alert('Error loading exam. Please try again.');
    }
  };

  const handleExamComplete = () => {
    setSelectedExam(null);
    setActiveView('results');
  };

  const handleBackToDashboard = () => {
    setSelectedExam(null);
  };

  // Get user display name or email
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Student';
  };

  // Get user photo URL or use default avatar
  const getUserPhotoURL = () => {
    return user?.photoURL || null;
  };

  // Sample data for stats and submissions
  const recentSubmissions = [
    {
      id: 1,
      teacherName: 'Prof. Smith',
      examName: 'Mathematics Final',
      totalMarks: 100,
      marksObtained: 92,
      percentage: 92,
      status: 'excellent',
      submissionTime: '2 hours ago'
    },
    {
      id: 2,
      teacherName: 'Dr. Johnson',
      examName: 'Physics Quiz',
      totalMarks: 50,
      marksObtained: 41,
      percentage: 82,
      status: 'good',
      submissionTime: '1 day ago'
    },
    {
      id: 3,
      teacherName: 'Ms. Williams',
      examName: 'Chemistry Test',
      totalMarks: 75,
      marksObtained: 53,
      percentage: 70.7,
      status: 'average',
      submissionTime: '3 days ago'
    }
  ];

  // If we have a selected exam, show the exam interface
  if (selectedExam) {
    return (
      <ExamInterface 
        exam={selectedExam}
        onExamComplete={handleExamComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="dashboard-container">
      {/* Splash Screen */}
      {showSplash && (
        <div className="welcome-splash">
          <div className="welcome-splash-content">
            <span className="wave-large">👋</span>
            <h1 className="welcome-splash-text">Welcome Back!</h1>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <div className="logo">
              <BookOpen size={32} strokeWidth={2.5} />
              <span className="logo-text">ExamNest</span>
            </div>
          </div>

          <div className="nav-links">
            <button
              className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${activeView === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveView('exams')}
            >
              Available Exams
            </button>
            <button
              className={`nav-link ${activeView === 'results' ? 'active' : ''}`}
              onClick={() => setActiveView('results')}
            >
              Results
            </button>
            <button
              className={`nav-link ${activeView === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveView('contact')}
            >
              Contact Us
            </button>
          </div>

          <div className="profile-section">
            <div className="notification-icon">
              <Bell size={24} />
              <span className="notification-badge">3</span>
            </div>
            <div className="profile-icon" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <div className="profile-circle">
                {getUserPhotoURL() ? (
                  <img 
                    src={getUserPhotoURL()} 
                    alt={getUserDisplayName()}
                    className="user-avatar-img"
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              
              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-item user-info">
                    <span className="user-name">{getUserDisplayName()}</span>
                    <span className="user-role">Student</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                <div
                  className="stat-card-inner"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <div className="stat-card-header">
                    <BookOpen size={40} className="stat-icon" />
                    <span className="stat-trend">All Time</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">12</div>
                    <div className="stat-title">Total Exams</div>
                    <div className="stat-subtitle">Completed</div>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              </div>

              <div className="stat-card" style={{ animationDelay: '0.2s' }}>
                <div
                  className="stat-card-inner"
                  style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                >
                  <div className="stat-card-header">
                    <Calendar size={40} className="stat-icon" />
                    <span className="stat-trend">This Week</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">3</div>
                    <div className="stat-title">Upcoming Exams</div>
                    <div className="stat-subtitle">Scheduled</div>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              </div>

              <div className="stat-card" style={{ animationDelay: '0.3s' }}>
                <div
                  className="stat-card-inner"
                  style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                >
                  <div className="stat-card-header">
                    <Award size={40} className="stat-icon" />
                    <span className="stat-trend">
                      <TrendingUp size={14} /> +5%
                    </span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">85%</div>
                    <div className="stat-title">Average Score</div>
                    <div className="stat-subtitle">Overall performance</div>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              </div>

              <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                <div
                  className="stat-card-inner"
                  style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
                >
                  <div className="stat-card-header">
                    <CheckCircle size={40} className="stat-icon" />
                    <span className="stat-trend">Latest</span>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">92%</div>
                    <div className="stat-title">Latest Result</div>
                    <div className="stat-subtitle">Mathematics Final</div>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              </div>
            </div>

            <div className="submissions-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Latest Submissions</h2>
                  <p className="section-subtitle">Your most recent exam results</p>
                </div>
                <button className="view-all-btn" onClick={() => setActiveView('results')}>
                  View All Results
                  <Award size={18} />
                </button>
              </div>

              <div className="table-container">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Teacher Name</th>
                      <th>Exam Name</th>
                      <th>Total Marks</th>
                      <th>Marks Obtained</th>
                      <th>Performance</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((submission, index) => (
                      <tr key={submission.id} className="table-row" style={{ animationDelay: `${index * 0.1}s` }}>
                        <td className="exam-name-cell">{submission.teacherName}</td>
                        <td className="exam-name-cell">{submission.examName}</td>
                        <td className="marks-cell">{submission.totalMarks}</td>
                        <td className="marks-obtained-cell">{submission.marksObtained}</td>
                        <td>
                          <div className="performance-bar-container">
                            <div
                              className="performance-bar"
                              style={{
                                width: `${submission.percentage}%`,
                                background: submission.percentage >= 90
                                  ? 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)'
                                  : submission.percentage >= 75
                                  ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                                  : 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)'
                              }}
                            >
                              <span className="performance-text">{submission.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${submission.status}`}>
                            {submission.status === 'excellent' && <Award size={14} />}
                            {submission.status === 'good' && <CheckCircle size={14} />}
                            {submission.status === 'average' && <AlertCircle size={14} />}
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </td>
                        <td className="time-cell">
                          <Clock size={14} />
                          {submission.submissionTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Available Exams View */}
        {activeView === 'exams' && (
          <div className="submissions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Available Examinations</h2>
                <p className="section-subtitle">Select an examination to begin your secure testing session</p>
              </div>
            </div>
            <AvailableExams onExamSelect={handleExamSelect} />
          </div>
        )}

        {/* Results View */}
        {activeView === 'results' && (
          <div className="submissions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Examination Results</h2>
                <p className="section-subtitle">Review your performance and detailed analytics</p>
              </div>
            </div>
            <Results />
          </div>
        )}

        {/* Contact Us View */}
        {activeView === 'contact' && (
          <div className="submissions-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Contact Us</h2>
                <p className="section-subtitle">Get in touch with our support team</p>
              </div>
            </div>
            <div className="contact-placeholder">
              <div className="contact-card">
                <div className="contact-icon">
                  <MessageCircle size={48} />
                </div>
                <h3>We're Here to Help</h3>
                <p>Contact our support team for any questions or issues regarding your examinations.</p>
                <div className="contact-info">
                  <p>📧 support@examnest.com</p>
                  <p>📞 +1 (555) 123-4567</p>
                  <p>🕒 Mon-Fri: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;