import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import ExamList from './Teacher/ExamList';
import ExamForm from './Teacher/ExamForm';
import QuestionForm from './Teacher/QuestionForm';
import ResultsView from './Teacher/ResultsView';
import ExamEditForm from './Teacher/ExamEditForm';
import './TeacherDashboard.css';

const TeacherDashboard = ({ user, onLogout, initialActiveTab = 'exams' }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('examNest-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  // Load selected exam from URL if examId is present
  useEffect(() => {
    if (examId) {
      fetchExamById(examId);
    }
  }, [examId]);

  // Update URL when activeTab or selectedExam changes
  useEffect(() => {
    if (selectedExam) {
      switch (activeTab) {
        case 'edit':
          navigate(`/teacher-dashboard/exams/${selectedExam.id}/edit`, { replace: true });
          break;
        case 'results':
          navigate(`/teacher-dashboard/exams/${selectedExam.id}/results`, { replace: true });
          break;
        case 'questions':
          navigate(`/teacher-dashboard/exams/${selectedExam.id}/questions`, { replace: true });
          break;
        default:
          navigate('/teacher-dashboard', { replace: true });
      }
    } else {
      navigate('/teacher-dashboard', { replace: true });
    }
  }, [activeTab, selectedExam, navigate]);

  const fetchExamById = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/exams/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const examData = await response.json();
        setSelectedExam(examData);
        handleInfo(`Loaded exam: ${examData.title}`);
      } else {
        handleApiError(new Error('Failed to fetch exam'), 'Loading exam');
        navigate('/teacher-dashboard');
      }
    } catch (error) {
      handleApiError(error, 'Loading exam');
      navigate('/teacher-dashboard');
    }
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setActiveTab('edit');
    handleInfo(`Editing exam: ${exam.title}`);
  };

  const handleViewResults = (exam) => {
    setSelectedExam(exam);
    setActiveTab('results');
    handleInfo(`Viewing results for: ${exam.title}`);
  };

  const handleManageQuestions = (exam) => {
    setSelectedExam(exam);
    setActiveTab('questions');
    handleInfo(`Managing questions for: ${exam.title}`);
  };

  const handleExamUpdated = (updatedExam) => {
    setSelectedExam(updatedExam);
    handleSuccess('Exam updated successfully!');
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'exams') {
      setSelectedExam(null);
      handleInfo('Viewing all exams');
    }
  };

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('examNest-theme', 'dark');
      handleInfo('Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('examNest-theme', 'light');
      handleInfo('Light mode enabled');
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    handleInfo('Logging out...');
    
    setTimeout(() => {
      signOut(auth).then(() => {
        handleSuccess('Logged out successfully');
        setTimeout(() => {
          onLogout();
          navigate('/login');
        }, 500);
      }).catch((error) => {
        handleApiError(error, 'Logout');
        setIsLoggingOut(false);
      });
    }, 1000);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
    handleInfo('Logout cancelled');
  };

  // Get user display name
  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Teacher';
  };

  // Get user photo URL
  const getUserPhotoURL = () => {
    return user?.photoURL || null;
  };

  // Enhanced inline styles with theme support
  const getStyles = (isDark) => ({
    container: {
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0e4b99 100%)'
        : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #dbeafe 50%, #ede9fe 75%, #fce7f3 100%)',
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.5s ease',
    },
    containerOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: isDark
        ? `radial-gradient(circle at 2px 2px, rgba(0, 255, 150, 0.12) 1px, transparent 0),
           radial-gradient(circle at 50px 50px, rgba(0, 150, 255, 0.08) 1px, transparent 0)`
        : `radial-gradient(circle at 2px 2px, rgba(14, 165, 233, 0.12) 1px, transparent 0),
           radial-gradient(circle at 50px 50px, rgba(14, 165, 233, 0.08) 1px, transparent 0)`,
      backgroundSize: '40px 40px, 100px 100px',
      backgroundPosition: '0 0, 25px 25px',
      animation: 'gridMove 28s linear infinite',
      pointerEvents: 'none',
      opacity: 0.3,
      zIndex: 0,
    },
    themeToggleBtn: {
      position: 'fixed',
      top: '20px',
      right: '80px',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: isDark 
        ? 'rgba(15, 23, 42, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      border: isDark 
        ? '2px solid rgba(0, 255, 150, 0.2)' 
        : '2px solid rgba(14, 165, 233, 0.2)',
      color: isDark ? '#f8fafc' : '#0f172a',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
      boxShadow: isDark
        ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 150, 0.1) inset'
        : '0 4px 20px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1) inset',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 30px',
      background: isDark 
        ? 'rgba(15, 23, 42, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      boxShadow: isDark
        ? '0 2px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 150, 0.1) inset'
        : '0 2px 20px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1) inset',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: isDark 
        ? '1px solid rgba(0, 255, 150, 0.2)' 
        : '1px solid rgba(14, 165, 233, 0.15)',
      transition: 'all 0.3s ease',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
      margin: 0,
      letterSpacing: '-0.5px',
      textShadow: isDark 
        ? '0 2px 10px rgba(0, 0, 0, 0.5)' 
        : '0 2px 10px rgba(14, 165, 233, 0.1)',
    },
    userProfile: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginRight: '20px',
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      overflow: 'hidden',
      background: isDark ? '#374151' : '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: isDark 
        ? '2px solid rgba(0, 255, 150, 0.3)' 
        : '2px solid rgba(14, 165, 233, 0.3)',
    },
    userAvatarImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    userRole: {
      fontSize: '12px',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    logoutContainer: {
      position: 'relative',
    },
    logoutBtn: {
      padding: '12px 24px',
      background: isDark 
        ? 'rgba(15, 23, 42, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      color: '#e74c3c',
      border: '2px solid #e74c3c',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 15px rgba(231, 76, 60, 0.2)',
      backdropFilter: 'blur(10px)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      position: 'relative',
      overflow: 'hidden',
    },
    logoutBtnHover: {
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f87171 50%, #fca5a5 100%)',
      color: 'white',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
    },
    logoutIcon: {
      fontSize: '16px',
      position: 'relative',
      zIndex: 1,
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,.3)',
      borderRadius: '50%',
      borderTopColor: '#fff',
      animation: 'spin 1s ease-in-out infinite',
    },
    confirmDialog: {
      position: 'absolute',
      top: '55px',
      right: 0,
      background: isDark 
        ? 'rgba(15, 23, 42, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(25px)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: isDark
        ? '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 150, 0.1) inset'
        : '0 10px 30px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1) inset',
      width: '280px',
      zIndex: 101,
      border: isDark 
        ? '2px solid rgba(0, 255, 150, 0.2)' 
        : '2px solid rgba(14, 165, 233, 0.15)',
      animation: 'confirmDialogSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    confirmText: {
      margin: '0 0 18px 0',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
    },
    confirmButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    confirmButton: {
      padding: '10px 18px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
    },
    confirmYes: {
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f87171 50%, #fca5a5 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
    },
    confirmNo: {
      background: isDark 
        ? 'rgba(0, 255, 150, 0.05)' 
        : 'rgba(14, 165, 233, 0.05)',
      color: isDark ? '#94a3b8' : '#64748b',
      border: isDark 
        ? '1px solid rgba(0, 255, 150, 0.2)' 
        : '1px solid rgba(14, 165, 233, 0.15)',
    },
    nav: {
      display: 'flex',
      gap: '8px',
      padding: '15px 30px',
      background: isDark 
        ? 'rgba(30, 41, 59, 0.9)' 
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(15px)',
      borderBottom: isDark 
        ? '1px solid rgba(0, 255, 150, 0.2)' 
        : '1px solid rgba(14, 165, 233, 0.15)',
      position: 'relative',
      zIndex: 90,
    },
    navButton: {
      padding: '12px 24px',
      background: isDark 
        ? 'rgba(0, 255, 150, 0.05)' 
        : 'rgba(14, 165, 233, 0.05)',
      border: isDark 
        ? '2px solid rgba(0, 255, 150, 0.2)' 
        : '2px solid rgba(14, 165, 233, 0.15)',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      color: isDark ? '#cbd5e1' : '#334155',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    },
    navButtonActive: {
      background: isDark
        ? 'linear-gradient(135deg, #00ff96 0%, #0096ff 25%, #6366f1 50%, #8b5cf6 100%)'
        : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 25%, #3b82f6 50%, #6366f1 100%)',
      color: 'white',
      borderColor: isDark ? '#00ff96' : '#0369a1',
      boxShadow: isDark
        ? '0 6px 20px rgba(0, 255, 150, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        : '0 6px 20px rgba(3, 105, 161, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
      transform: 'translateY(-1px)',
    },
    navButtonHover: {
      color: isDark ? '#f8fafc' : '#0f172a',
      borderColor: isDark ? '#00ff96' : '#0369a1',
      transform: 'translateY(-2px)',
      boxShadow: isDark
        ? '0 6px 20px rgba(0, 0, 0, 0.4)'
        : '0 6px 20px rgba(14, 165, 233, 0.15)',
    },
    content: {
      padding: '30px',
      position: 'relative',
      zIndex: 80,
      minHeight: 'calc(100vh - 140px)',
    },
    // Notification styles
    notificationContainer: {
      position: 'fixed',
      top: '100px',
      right: '20px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
    },
    notification: {
      padding: '15px 20px',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      border: isDark 
        ? '2px solid rgba(0, 255, 150, 0.2)' 
        : '2px solid rgba(14, 165, 233, 0.2)',
      boxShadow: isDark
        ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 150, 0.1) inset'
        : '0 4px 20px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1) inset',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      animation: 'confirmDialogSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      maxWidth: '350px',
      wordWrap: 'break-word',
      cursor: 'pointer',
    },
    notificationSuccess: {
      background: isDark 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(16, 185, 129, 0.1)',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
    },
    notificationError: {
      background: isDark 
        ? 'rgba(239, 68, 68, 0.15)' 
        : 'rgba(239, 68, 68, 0.1)',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
    },
    notificationInfo: {
      background: isDark 
        ? 'rgba(59, 130, 246, 0.15)' 
        : 'rgba(59, 130, 246, 0.1)',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
    },
  });

  const styles = getStyles(isDarkMode);

  return (
    <div style={styles.container}>
      {/* Notification Container */}
      <div style={styles.notificationContainer}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              ...styles.notification,
              ...(notification.type === 'success' ? styles.notificationSuccess : {}),
              ...(notification.type === 'error' ? styles.notificationError : {}),
              ...(notification.type === 'info' ? styles.notificationInfo : {}),
            }}
            onClick={() => removeNotification(notification.id)}
          >
            {notification.message}
          </div>
        ))}
      </div>
      
      {/* Background Overlay */}
      <div style={styles.containerOverlay}></div>
      
      {/* Theme Toggle Button */}
      <button
        style={styles.themeToggleBtn}
        onClick={toggleTheme}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.05)';
          e.target.style.boxShadow = isDarkMode
            ? '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 150, 0.3)'
            : '0 8px 25px rgba(14, 165, 233, 0.2), 0 0 30px rgba(14, 165, 233, 0.3)';
          e.target.style.borderColor = isDarkMode ? '#00ff96' : '#0369a1';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = styles.themeToggleBtn.boxShadow;
          e.target.style.borderColor = styles.themeToggleBtn.border.split(' ')[2];
        }}
      >
        {isDarkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </button>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Teacher Dashboard</h1>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>
              {getUserPhotoURL() ? (
                <img 
                  src={getUserPhotoURL()} 
                  alt={getUserDisplayName()}
                  style={styles.userAvatarImg}
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{getUserDisplayName()}</span>
              <span style={styles.userRole}>Teacher</span>
            </div>
          </div>
        </div>
        <div style={styles.logoutContainer}>
          <button
            onClick={handleLogoutClick}
            style={styles.logoutBtn}
            disabled={isLoggingOut}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                Object.assign(e.target.style, styles.logoutBtnHover);
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                Object.assign(e.target.style, styles.logoutBtn);
              }
            }}
          >
            {isLoggingOut ? (
              <>
                <span style={styles.loadingSpinner}></span>
                <span style={{ position: 'relative', zIndex: 1 }}>Logging out...</span>
              </>
            ) : (
              <>
                <span style={styles.logoutIcon}>⎋</span>
                <span style={{ position: 'relative', zIndex: 1 }}>Logout</span>
              </>
            )}
          </button>

          {showLogoutConfirm && (
            <div style={styles.confirmDialog}>
              <p style={styles.confirmText}>Are you sure you want to logout?</p>
              <div style={styles.confirmButtons}>
                <button
                  style={{...styles.confirmButton, ...styles.confirmNo}}
                  onClick={handleCancelLogout}
                  onMouseEnter={(e) => {
                    e.target.style.background = isDarkMode 
                      ? 'rgba(0, 255, 150, 0.1)' 
                      : 'rgba(14, 165, 233, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = styles.confirmNo.background;
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{...styles.confirmButton, ...styles.confirmYes}}
                  onClick={handleConfirmLogout}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = styles.confirmYes.boxShadow;
                  }}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <nav style={styles.nav}>
        <button 
          style={{
            ...styles.navButton,
            ...(activeTab === 'exams' ? styles.navButtonActive : {})
          }}
          onClick={() => handleTabChange('exams')}
          onMouseEnter={(e) => {
            if (activeTab !== 'exams') {
              Object.assign(e.target.style, styles.navButtonHover);
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'exams') {
              Object.assign(e.target.style, styles.navButton);
            }
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>My Exams</span>
        </button>
        
        <button 
          style={{
            ...styles.navButton,
            ...(activeTab === 'create' ? styles.navButtonActive : {})
          }}
          onClick={() => {
            setActiveTab('create');
            handleInfo('Creating new exam');
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'create') {
              Object.assign(e.target.style, styles.navButtonHover);
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'create') {
              Object.assign(e.target.style, styles.navButton);
            }
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>Create Exam</span>
        </button>
        
        {selectedExam && (
          <>
            <button 
              style={{
                ...styles.navButton,
                ...(activeTab === 'edit' ? styles.navButtonActive : {})
              }}
              onClick={() => setActiveTab('edit')}
              onMouseEnter={(e) => {
                if (activeTab !== 'edit') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'edit') {
                  Object.assign(e.target.style, styles.navButton);
                }
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Edit Exam</span>
            </button>
            
            <button 
              style={{
                ...styles.navButton,
                ...(activeTab === 'questions' ? styles.navButtonActive : {})
              }}
              onClick={() => setActiveTab('questions')}
              onMouseEnter={(e) => {
                if (activeTab !== 'questions') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'questions') {
                  Object.assign(e.target.style, styles.navButton);
                }
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Manage Questions</span>
            </button>
            
            <button 
              style={{
                ...styles.navButton,
                ...(activeTab === 'results' ? styles.navButtonActive : {})
              }}
              onClick={() => setActiveTab('results')}
              onMouseEnter={(e) => {
                if (activeTab !== 'results') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'results') {
                  Object.assign(e.target.style, styles.navButton);
                }
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>View Results</span>
            </button>
          </>
        )}
      </nav>
      
      <div style={styles.content}>
        {activeTab === 'exams' && (
          <ExamList 
            onSelectExam={setSelectedExam}
            onExamSelect={handleManageQuestions}
            onEditExam={handleEditExam}
            onViewResults={handleViewResults}
            onNotification={showNotification}
          />
        )}
        
        {activeTab === 'create' && (
          <ExamForm 
            onExamCreated={(exam) => {
              setSelectedExam(exam);
              setActiveTab('questions');
              handleSuccess(`Exam "${exam.title}" created successfully!`);
            }}
            onNotification={showNotification}
          />
        )}
        
        {activeTab === 'edit' && selectedExam && (
          <ExamEditForm 
            exam={selectedExam}
            onExamUpdated={handleExamUpdated}
            onBack={() => {
              setActiveTab('exams');
              setSelectedExam(null);
            }}
            onNotification={showNotification}
          />
        )}
        
        {activeTab === 'questions' && selectedExam && (
          <QuestionForm 
            exam={selectedExam}
            onBack={() => setActiveTab('exams')}
            onNotification={showNotification}
          />
        )}
        
        {activeTab === 'results' && selectedExam && (
          <ResultsView 
            exam={selectedExam}
            onBack={() => setActiveTab('exams')}
            onNotification={showNotification}
          />
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes gridMove {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(20px, 15px) rotate(90deg); }
            50% { transform: translate(40px, 30px) rotate(180deg); }
            75% { transform: translate(20px, 45px) rotate(270deg); }
            100% { transform: translate(0, 60px) rotate(360deg); }
          }
          
          @keyframes confirmDialogSlide {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default TeacherDashboard;