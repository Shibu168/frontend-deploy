import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
// Components
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import PrivateExamAccess from './components/Student/PrivateExamAccess';
import ExamInterface from './components/Student/ExamInterface';

import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Token management helper
const tokenManager = {
  getToken: () => {
    const token = localStorage.getItem('token');
    console.log('[DEBUG] Getting token from storage:', token ? 'Token exists' : 'No token');
    return token;
  },
  
  setToken: (token) => {
    console.log('[DEBUG] Setting token in storage:', token ? 'Token exists' : 'No token');
    if (token && token !== 'null' && token !== 'undefined') {
      localStorage.setItem('token', token);
    } else {
      console.error('[DEBUG] Invalid token attempted to be stored:', token);
    }
  },
  
  clearToken: () => {
    console.log('[DEBUG] Clearing token from storage');
    localStorage.removeItem('token');
  },
  
  isValidToken: (token) => {
    return token && token !== 'null' && token !== 'undefined' && token.length > 10;
  }
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('[DEBUG] State changed:', {
      user: user ? `${user.name} (${user.email})` : null,
      userRole,
      needsRegistration,
      emailVerificationPending,
      pendingEmail,
      loading,
      hasToken: !!tokenManager.getToken()
    });
  }, [user, userRole, needsRegistration, emailVerificationPending, pendingEmail, loading]);

  // Restore session
  useEffect(() => {
    console.log('[DEBUG] Restoring session from localStorage...');
    const savedUser = localStorage.getItem('user');
    const savedToken = tokenManager.getToken();

    console.log('[DEBUG] Found in storage:', {
      user: !!savedUser,
      token: !!savedToken
    });

    if (savedUser && tokenManager.isValidToken(savedToken)) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
        console.log('[DEBUG] Session restored, userRole:', parsedUser.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        tokenManager.clearToken();
      }
    } else if (savedUser && !savedToken) {
      console.log('[DEBUG] Inconsistent state: user exists but no token');
      localStorage.removeItem('user');
    }

    setLoading(false);
  }, []);

  // Firebase auth listener
  useEffect(() => {
    console.log('[DEBUG] Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[DEBUG] Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      
      if (firebaseUser) {
        try {
          console.log('[DEBUG] Firebase user detected:', firebaseUser.email);
          
          // Always reload to get latest verification status
          await firebaseUser.reload();
          const updatedUser = auth.currentUser;
          console.log('[DEBUG] Email verification status after reload:', updatedUser.emailVerified);
          
          const idToken = await updatedUser.getIdToken();
          
          // Check if this is a user who just verified their email
          if (emailVerificationPending && updatedUser.email === pendingEmail) {
            if (updatedUser.emailVerified) {
              console.log('[DEBUG] Email verified! Processing verified user...');
              await handleVerifiedUserLogin(idToken, updatedUser);
            } else {
              console.log('[DEBUG] Email still not verified, waiting...');
              setLoading(false);
            }
          } else {
            // Normal login flow
            await handleLogin(idToken, updatedUser);
          }
        } catch (error) {
          console.error('[DEBUG] Error in auth state change:', error);
          setError('Authentication error. Please try again.');
          setLoading(false);
        }
      } else {
        console.log('[DEBUG] No Firebase user, clearing state');
        setUser(null);
        setUserRole(null);
        setNeedsRegistration(false);
        setEmailVerificationPending(false);
        setPendingEmail('');
        tokenManager.clearToken();
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [emailVerificationPending, pendingEmail]);

  // Handle verified user login (after email verification)
  const handleVerifiedUserLogin = async (idToken, firebaseUser) => {
    console.log('[DEBUG] handleVerifiedUserLogin called for:', firebaseUser.email);
    
    if (!tokenManager.isValidToken(idToken)) {
      console.error('[DEBUG] Invalid token provided to handleVerifiedUserLogin');
      setError('Invalid authentication token');
      return;
    }

    setLoading(true);
    setError('');
    try {
      tokenManager.setToken(idToken);

      const response = await axios.post(`${BACKEND_URL}/api/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: 10000
      });

      console.log('[DEBUG] /verify response after verification:', response.data);

      if (response.data.success) {
        // User exists in database
        setUser(response.data.user);
        setUserRole(response.data.user.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setNeedsRegistration(false);
        setEmailVerificationPending(false);
        setPendingEmail('');
        console.log('[DEBUG] Verified user logged in, role:', response.data.user.role);
      } else {
        // New user - proceed to role selection
        setRegistrationInfo({
          ...response.data.user,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
        });
        setNeedsRegistration(true);
        setEmailVerificationPending(false);
        setPendingEmail('');
        console.log('[DEBUG] New verified user needs registration');
      }
    } catch (error) {
      console.error('[DEBUG] Error verifying token after email verification:', error);
      setError('Server error during verification. Please try again.');
      setEmailVerificationPending(false);
      setPendingEmail('');
    } finally {
      setLoading(false);
    }
  };

  // Handle normal login
  const handleLogin = async (idToken, firebaseUser = null) => {
    console.log('[DEBUG] handleLogin called');
    
    if (!tokenManager.isValidToken(idToken)) {
      console.error('[DEBUG] Invalid token provided to handleLogin:', idToken);
      setError('Invalid authentication token');
      return;
    }

    setLoading(true);
    setError('');
    try {
      tokenManager.setToken(idToken);

      const response = await axios.post(`${BACKEND_URL}/api/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: 10000
      });

      console.log('[DEBUG] /verify response:', response.data);

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        setUserRole(userData.role);
        localStorage.setItem('user', JSON.stringify(userData));
        setNeedsRegistration(false);
        
        console.log('[DEBUG] User logged in, role:', userData.role);
        
        // ✅ Check if user is admin and redirect accordingly
        if (userData.role === 'admin') {
          console.log('[DEBUG] Admin user detected, should redirect to admin dashboard');
        }
        
      } else {
        // For new users, check if email is verified
        if (firebaseUser && !firebaseUser.emailVerified) {
          console.log('[DEBUG] Email not verified, waiting for verification...');
          setEmailVerificationPending(true);
          setPendingEmail(firebaseUser.email);
          setLoading(false);
          return;
        }
        
        // Email is verified, proceed to registration
        setRegistrationInfo({
          ...response.data.user,
          email: firebaseUser?.email || response.data.user?.email,
          name: firebaseUser?.displayName || response.data.user?.name || (firebaseUser?.email?.split('@')[0])
        });
        setNeedsRegistration(true);
        console.log('[DEBUG] New user detected, needs registration');
      }
    } catch (error) {
      console.error('[DEBUG] Error verifying token:', error.response?.data || error.message);
      setError('Server error during login. Please try again.');
      
      if (error.response?.status === 401) {
        tokenManager.clearToken();
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email registration (when user signs up)
  const handleEmailRegistration = (email) => {
    console.log('[DEBUG] Email registration initiated for:', email);
    setEmailVerificationPending(true);
    setPendingEmail(email);
    setError('');
  };

  // Handle login from PrivateExamAccess component
  const handleLoginFromComponent = async (userData) => {
    console.log('[DEBUG] handleLoginFromComponent called with:', userData);
    
    const currentToken = tokenManager.getToken();
    
    if (userData && tokenManager.isValidToken(currentToken)) {
      setUser(userData);
      setUserRole(userData.role);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('[DEBUG] User set from component:', userData.role);
    } else {
      console.warn('[DEBUG] Cannot set user: invalid token or user data');
      setError('Invalid session. Please login again.');
    }
  };

  // Register user with better error handling
  const handleRegister = async (role) => {
    console.log('[DEBUG] handleRegister called with role:', role);
    setLoading(true);
    setError('');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found. Please login again.');
      }

      // Get fresh token
      const idToken = await currentUser.getIdToken(true);
      
      if (!tokenManager.isValidToken(idToken)) {
        throw new Error('No valid authentication token available');
      }

      tokenManager.setToken(idToken);

      console.log('[DEBUG] Sending registration request with role:', role);
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/register`, 
        { role }, 
        {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('[DEBUG] /register response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setUserRole(response.data.user.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setNeedsRegistration(false);
        console.log('[DEBUG] Registration completed, userRole:', response.data.user.role);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('[DEBUG] Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/user-token-expired') {
        errorMessage = 'Session expired. Please login again.';
        tokenManager.clearToken();
        localStorage.removeItem('user');
      } else if (error.response) {
        // Server responded with error status
        if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // No response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    console.log('[DEBUG] Logging out user');
    tokenManager.clearToken();
    localStorage.removeItem('user');
    setUser(null);
    setUserRole(null);
    setNeedsRegistration(false);
    setEmailVerificationPending(false);
    setPendingEmail('');
    setError('');
    auth.signOut();
    window.location.href = '/login';
  };

  // Helper: redirect based on role
  const redirectByRole = (role) => {
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  // Show email verification pending screen
  if (emailVerificationPending) {
    return (
      <div style={styles.verificationContainer}>
        <div style={styles.verificationContent}>
          <div style={styles.verificationIcon}>📧</div>
          <h2>Verify Your Email Address</h2>
          
          <div style={styles.verificationMessage}>
            <p>We've sent a verification email to:</p>
            <p style={styles.emailHighlight}>{pendingEmail}</p>
            <p>Please check your inbox and click the verification link to continue.</p>
            <p>You'll be automatically redirected to role selection once your email is verified.</p>
          </div>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <div style={styles.tips}>
            <h4>Didn't receive the email?</h4>
            <ul>
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
              <li>Try signing in again after verification</li>
            </ul>
          </div>

          <div style={styles.buttonGroup}>
            <button 
              onClick={async () => {
                try {
                  const user = auth.currentUser;
                  if (user) {
                    await user.reload();
                    const updatedUser = auth.currentUser;
                    if (updatedUser.emailVerified) {
                      console.log('[DEBUG] Manual check: Email verified!');
                      const idToken = await updatedUser.getIdToken();
                      await handleVerifiedUserLogin(idToken, updatedUser);
                    } else {
                      alert('Email not verified yet. Please check your inbox and click the verification link.');
                    }
                  }
                } catch (error) {
                  console.error('Error checking verification:', error);
                  setError('Error checking verification status. Please try again.');
                }
              }}
              style={styles.checkButton}
            >
              I've Verified My Email
            </button>
            
            <button 
              onClick={() => {
                setEmailVerificationPending(false);
                setPendingEmail('');
                setError('');
                auth.signOut();
              }}
              style={styles.backButton}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={
        user ? 
          (userRole === 'admin' ? 
            <Navigate to="/admin-dashboard" /> : 
            <Navigate to={redirectByRole(userRole)} />
          ) : 
          (needsRegistration ? <Navigate to="/register" /> : <Navigate to="/login" />)
      } />

      {/* Login/Register */}
      <Route path="/login" element={
        user ? 
          (userRole === 'admin' ? 
            <Navigate to="/admin-dashboard" /> : 
            <Navigate to={redirectByRole(userRole)} />
          ) : 
          (needsRegistration ? <Navigate to="/register" /> : 
            <Login onLoginSuccess={handleLogin} onEmailRegistration={handleEmailRegistration} />)
      } />
      
      <Route path="/register" element={
        needsRegistration ? (
          <Register 
            userInfo={registrationInfo} 
            onRegister={handleRegister} 
            error={error}
            onClearError={() => setError('')}
          />
        ) : 
        user ? 
          (userRole === 'admin' ? 
            <Navigate to="/admin-dashboard" /> : 
            <Navigate to={redirectByRole(userRole)} />
          ) : 
          <Navigate to="/login" />
      } />

      {/* ✅ UPDATED: All dashboards use regular user authentication */}
      <Route path="/admin-dashboard" element={
        user && userRole === 'admin' ? 
          <AdminDashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
      } />
      
      <Route path="/student-dashboard" element={
        user && userRole === 'student' ? 
          <StudentDashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
      } />
      
      <Route path="/teacher-dashboard" element={
        user && userRole === 'teacher' ? 
          <TeacherDashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
      } />

      {/* Exam routes */}
      <Route 
        path="/exam/:token" 
        element={
          <PrivateExamAccess 
            user={user} 
            onLogin={handleLoginFromComponent} 
          />
        } 
      />
      
      <Route 
        path="/exam-interface" 
        element={
          user ? <ExamInterface user={user} /> : <Navigate to="/login" replace />
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const styles = {
  verificationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  verificationContent: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '90%',
  },
  verificationIcon: {
    fontSize: '60px',
    marginBottom: '20px',
  },
  verificationMessage: {
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#1976d2',
    fontSize: '18px',
    margin: '10px 0',
  },
  tips: {
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  checkButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    margin: '10px 0',
    border: '1px solid #fcc'
  }
};

// Main App component
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;