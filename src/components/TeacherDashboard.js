import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Activity, GraduationCap, CheckCircle, AlertCircle, Award, Clock } from 'lucide-react';
import ExamList from './Teacher/ExamList';
import ExamForm from './Teacher/ExamForm';
import QuestionForm from './Teacher/QuestionForm';
import ResultsView from './Teacher/ResultsView';
import './TeacherDashboard.css';

const TeacherDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    setTimeout(() => {
      signOut(auth).then(() => {
        onLogout();
        navigate('/login');
      }).catch((error) => {
        console.error('Logout error:', error);
        setIsLoggingOut(false);
      });
    }, 1000);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    console.log("Selected exam changed:", selectedExam);
  }, [selectedExam]);

  // Get user display name
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Teacher';
  };

  // Get user initial for profile
  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'Total Exams Created',
      value: 24,
      icon: <BookOpen size={36} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: '+12%',
      subtitle: 'vs last month'
    },
    {
      title: 'Upcoming Exams',
      value: 5,
      icon: <Calendar size={36} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      trend: '3 this week',
      subtitle: '2 next week'
    },
    {
      title: 'Total Students Enrolled',
      value: 152,
      icon: <Users size={36} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      trend: '+8%',
      subtitle: 'Active learners'
    },
    {
      title: 'Ongoing Exams',
      value: 3,
      icon: <Activity size={36} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      trend: 'Live now',
      subtitle: '24 students online'
    }
  ];

  // Mock data for recent submissions
  const submissions = [
    {
      id: 1,
      fullName: 'Priya Sharma',
      totalMarks: 100,
      marksObtained: 87,
      percentage: 87,
      submissionTime: '2:35 PM',
      status: 'good',
      examName: 'Mathematics Final'
    },
    {
      id: 2,
      fullName: 'Rahul Verma',
      totalMarks: 100,
      marksObtained: 92,
      percentage: 92,
      submissionTime: '2:28 PM',
      status: 'excellent',
      examName: 'Physics Mid-term'
    },
    {
      id: 3,
      fullName: 'Anita Desai',
      totalMarks: 100,
      marksObtained: 78,
      percentage: 78,
      submissionTime: '2:40 PM',
      status: 'average',
      examName: 'Chemistry Quiz'
    },
    {
      id: 4,
      fullName: 'Vikram Singh',
      totalMarks: 100,
      marksObtained: 95,
      percentage: 95,
      submissionTime: '2:25 PM',
      status: 'excellent',
      examName: 'Biology Test'
    },
    {
      id: 5,
      fullName: 'Sneha Patel',
      totalMarks: 100,
      marksObtained: 83,
      percentage: 83,
      submissionTime: '2:38 PM',
      status: 'good',
      examName: 'English Literature'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Welcome Splash */}
      {showWelcome && (
        <div className="welcome-splash">
          <div className="welcome-splash-content">
            <span className="wave-large">👋</span>
            <h1 className="welcome-splash-text">Welcome, {getUserDisplayName()}!</h1>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <div className="logo">
              <GraduationCap size={32} />
              <span className="logo-text">ExamNest</span>
            </div>
          </div>
          <div className="nav-links">
            {['Dashboard', 'My Exams', 'Create Exam', 'Results', 'Monitor'].map((item) => (
              <a
                key={item}
                href="#"
                className={`nav-link ${activeTab === item ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item);
                }}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="profile-section">
            <div className="notification-icon">
              <Activity size={20} />
              <span className="notification-badge">3</span>
            </div>
            <div className="profile-icon" onClick={handleLogoutClick}>
              <div className="profile-circle">{getUserInitial()}</div>
            </div>
          </div>
        </nav>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="confirm-dialog modal-content">
            <h3>Confirm Logout</h3>
            <p className="confirm-text">Are you sure you want to logout?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-button confirm-no"
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="confirm-button confirm-yes"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'Dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="stat-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="stat-card-inner"
                    style={{ background: stat.gradient }}
                  >
                    <div className="stat-card-header">
                      <div className="stat-icon">{stat.icon}</div>
                      <div className="stat-trend">{stat.trend}</div>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{stat.value}</h3>
                      <p className="stat-title">{stat.title}</p>
                      <p className="stat-subtitle">{stat.subtitle}</p>
                    </div>
                    <div className="stat-card-glow"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Latest Submissions Section */}
            <div className="submissions-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Latest Submissions</h2>
                  <p className="section-subtitle">Recent exam submissions from your students</p>
                </div>
                <button className="view-all-btn">
                  View All
                  <CheckCircle size={18} />
                </button>
              </div>
              <div className="table-container">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Exam Name</th>
                      <th>Total Marks</th>
                      <th>Marks Obtained</th>
                      <th>Performance</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission, index) => (
                      <tr key={submission.id} className="table-row" style={{ animationDelay: `${index * 0.1}s` }}>
                        <td className="name-cell">
                          <div className="student-info">
                            <div className="student-avatar">
                              {submission.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span>{submission.fullName}</span>
                          </div>
                        </td>
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
                              <span className="performance-text">{submission.percentage}%</span>
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

        {activeTab === 'My Exams' && (
          <div className="tab-content-wrapper">
            <ExamList 
              onSelectExam={setSelectedExam}
              onExamSelect={(exam) => {
                setSelectedExam(exam);
                setActiveTab('Create Exam');
              }}
            />
          </div>
        )}

        {activeTab === 'Create Exam' && (
          <div className="tab-content-wrapper">
            {selectedExam ? (
              <QuestionForm 
                exam={selectedExam}
                onBack={() => {
                  setSelectedExam(null);
                  setActiveTab('My Exams');
                }}
              />
            ) : (
              <ExamForm 
                onExamCreated={(exam) => {
                  setSelectedExam(exam);
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'Results' && (
          <div className="tab-content-wrapper">
            {selectedExam ? (
              <ResultsView 
                exam={selectedExam}
                onBack={() => {
                  setSelectedExam(null);
                  setActiveTab('My Exams');
                }}
              />
            ) : (
              <div className="select-exam-prompt">
                <h2>View Results</h2>
                <p>Please select an exam from "My Exams" to view results</p>
                <button 
                  className="view-exams-btn"
                  onClick={() => setActiveTab('My Exams')}
                >
                  Go to My Exams
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Monitor' && (
          <div className="tab-content-wrapper">
            <div className="monitoring-section">
              <h2>Live Monitoring</h2>
              <p>Real-time exam monitoring features will be implemented here.</p>
              <div className="monitoring-stats">
                <div className="monitoring-stat">
                  <Activity size={24} />
                  <span>Live Sessions: 3</span>
                </div>
                <div className="monitoring-stat">
                  <Users size={24} />
                  <span>Active Students: 24</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;