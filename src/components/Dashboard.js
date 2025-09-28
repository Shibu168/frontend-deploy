import React, { useState } from 'react';

const Dashboard = ({ user, onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAdminRedirect = () => {
    window.location.href = '/admin-dashboard';
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    // Simulate a brief delay before logging out
    setTimeout(() => {
      onLogout();
    }, 1000);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 30px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0,
    },
    logoutContainer: {
      position: 'relative',
    },
    logoutBtn: {
      padding: '10px 20px',
      backgroundColor: '#fff',
      color: '#e74c3c',
      border: '1px solid #e74c3c',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 5px rgba(231, 76, 60, 0.2)',
    },
    logoutBtnHover: {
      backgroundColor: '#e74c3c',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
    },
    logoutBtnActive: {
      transform: 'translateY(0)',
      boxShadow: '0 2px 5px rgba(231, 76, 60, 0.2)',
    },
    logoutIcon: {
      fontSize: '16px',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255,255,255,.3)',
      borderRadius: '50%',
      borderTopColor: '#fff',
      animation: 'spin 1s ease-in-out infinite',
    },
    confirmDialog: {
      position: 'absolute',
      top: '45px',
      right: 0,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
      width: '250px',
      zIndex: 101,
      border: '1px solid #e0e0e0',
    },
    confirmText: {
      margin: '0 0 15px 0',
      color: '#2c3e50',
      fontSize: '14px',
    },
    confirmButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    confirmButton: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    confirmYes: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
    confirmYesHover: {
      backgroundColor: '#c0392b',
    },
    confirmNo: {
      backgroundColor: '#f0f0f0',
      color: '#7f8c8d',
    },
    confirmNoHover: {
      backgroundColor: '#e0e0e0',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Exam Portal</h1>
        <div style={styles.logoutContainer}>
          <button
            onClick={handleLogoutClick}
            style={styles.logoutBtn}
            disabled={isLoggingOut}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                e.target.style.backgroundColor = styles.logoutBtnHover.backgroundColor;
                e.target.style.color = styles.logoutBtnHover.color;
                e.target.style.transform = styles.logoutBtnHover.transform;
                e.target.style.boxShadow = styles.logoutBtnHover.boxShadow;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                e.target.style.backgroundColor = styles.logoutBtn.backgroundColor;
                e.target.style.color = styles.logoutBtn.color;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = styles.logoutBtn.boxShadow;
              }
            }}
            onMouseDown={(e) => {
              e.target.style.transform = styles.logoutBtnActive.transform;
              e.target.style.boxShadow = styles.logoutBtnActive.boxShadow;
            }}
            onMouseUp={(e) => {
              e.target.style.transform = styles.logoutBtnHover.transform;
              e.target.style.boxShadow = styles.logoutBtnHover.boxShadow;
            }}
          >
            {isLoggingOut ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Logging out...
              </>
            ) : (
              <>
                <span style={styles.logoutIcon}>⎋</span>
                Logout
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
                    e.target.style.backgroundColor = styles.confirmNoHover.backgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = styles.confirmNo.backgroundColor;
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{...styles.confirmButton, ...styles.confirmYes}}
                  onClick={handleConfirmLogout}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.confirmYesHover.backgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = styles.confirmYes.backgroundColor;
                  }}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Rest of the dashboard content */}
      <div style={{padding: '20px'}}>
        <h2>Welcome to your dashboard, {user.role}!</h2>
        {/* Your dashboard content here */}
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;