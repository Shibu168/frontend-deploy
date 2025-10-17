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
  const [dashboardData, setDashboardData] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      
      // Fetch teacher's exams
      const examsResponse = await fetch('/api/teacher/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!examsResponse.ok) throw new Error('Failed to fetch exams');
      const exams = await examsResponse.json();

      // Calculate dashboard statistics
      const now = new Date();
      const totalExams = exams.length;
      
      const upcomingExams = exams.filter(exam => 
        new Date(exam.start_time) > now
      ).length;
      
      const ongoingExams = exams.filter(exam => {
        const startTime = new Date(exam.start_time);
        const endTime = new Date(exam.end_time);
        return now >= startTime && now <= endTime;
      }).length;

      // Fetch all exam attempts to get student count and recent submissions
      let allStudents = new Set();
      let allSubmissions = [];

      for (const exam of exams) {
        try {
          const resultsResponse = await fetch(`/api/teacher/exams/${exam.id}/results`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (resultsResponse.ok) {
            const results = await resultsResponse.json();
            
            results.forEach(attempt => {
              // Add student to unique set
              if (attempt.student) {
                allStudents.add(attempt.student.id);
              }

              // Prepare submission data
              if (attempt.end_time) {
                const totalMarks = attempt.answers?.reduce((sum, answer) => 
                  sum + (answer.question?.marks || 0), 0) || exam.total_marks || 100;
                
                const marksObtained = attempt.answers?.reduce((sum, answer) => 
                  sum + (answer.marks_obtained || 0), 0) || attempt.score || 0;
                
                const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

                let status = 'average';
                if (percentage >= 90) status = 'excellent';
                else if (percentage >= 75) status = 'good';

                allSubmissions.push({
                  id: attempt.id,
                  fullName: attempt.student?.name || 'Unknown Student',
                  totalMarks: totalMarks,
                  marksObtained: marksObtained,
                  percentage: percentage,
                  submissionTime: new Date(attempt.end_time).toLocaleTimeString([], { 
                    hour: '2-digit', minute: '2-digit' 
                  }),
                  status: status,
                  examName: exam.title,
                  student: attempt.student
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching results for exam ${exam.id}:`, error);
        }
      }

      // Sort submissions by submission time (most recent first) and take latest 5
      const sortedSubmissions = allSubmissions
        .sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime))
        .slice(0, 5);

      setDashboardData({
        totalExams,
        upcomingExams,
        totalStudents: allStudents.size,
        ongoingExams
      });

      setRecentSubmissions(sortedSubmissions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to dummy data if API fails
      setDashboardData({
        totalExams: 0,
        upcomingExams: 0,
        totalStudents: 0,
        ongoingExams: 0
      });
      setRecentSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Stats data based on real data
  const stats = [
    {
      title: 'Total Exams Created',
      value: dashboardData?.totalExams || 0,
      icon: <BookOpen size={36} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: dashboardData?.totalExams > 0 ? '+0%' : 'No exams',
      subtitle: 'All your exams'
    },
    {
      title: 'Upcoming Exams',
      value: dashboardData?.upcomingExams || 0,
      icon: <Calendar size={36} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      trend: dashboardData?.upcomingExams > 0 ? 'Scheduled' : 'No upcoming',
      subtitle: dashboardData?.upcomingExams > 0 ? 'Check schedule' : 'All clear'
    },
    {
      title: 'Total Students Enrolled',
      value: dashboardData?.totalStudents || 0,
      icon: <Users size={36} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      trend: dashboardData?.totalStudents > 0 ? 'Active' : 'No students',
      subtitle: 'Across all exams'
    },
    {
      title: 'Ongoing Exams',
      value: dashboardData?.ongoingExams || 0,
      icon: <Activity size={36} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      trend: dashboardData?.ongoingExams > 0 ? 'Live now' : 'No active',
      subtitle: dashboardData?.ongoingExams > 0 ? 'Monitor progress' : 'All completed'
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
            {/* Loading State */}
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading dashboard data...</p>
              </div>
            )}

            {/* Stats Cards */}
            {!loading && (
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
            )}

            {/* Latest Submissions Section */}
            {!loading && (
              <div className="submissions-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Latest Submissions</h2>
                    <p className="section-subtitle">
                      {recentSubmissions.length > 0 
                        ? 'Recent exam submissions from your students' 
                        : 'No submissions yet'}
                    </p>
                  </div>
                  {recentSubmissions.length > 0 && (
                    <button className="view-all-btn">
                      View All
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
                
                {recentSubmissions.length > 0 ? (
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
                        {recentSubmissions.map((submission, index) => (
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
                ) : (
                  !loading && (
                    <div className="no-data-message">
                      <BookOpen size={48} />
                      <h3>No Submissions Yet</h3>
                      <p>Student submissions will appear here once they start taking your exams.</p>
                    </div>
                  )
                )}
              </div>
            )}
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
                  // Refresh dashboard data when new exam is created
                  fetchDashboardData();
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
                  <span>Live Sessions: {dashboardData?.ongoingExams || 0}</span>
                </div>
                <div className="monitoring-stat">
                  <Users size={24} />
                  <span>Total Students: {dashboardData?.totalStudents || 0}</span>
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