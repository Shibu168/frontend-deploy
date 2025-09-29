// components/Login.js
import React, { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import EmailAuth from './EmailAuth';
import './Login.css';

const Login = ({ onLoginSuccess, onEmailRegistration }) => {
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [securityStatus, setSecurityStatus] = useState("secure"); 

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark-theme", !isDarkMode);
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      if (!user) throw new Error("No user returned from Firebase");

      const idToken = await user.getIdToken();

      localStorage.setItem("token", idToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
        })
      );

      setSecurityStatus("secure");
      onLoginSuccess(idToken);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setSecurityStatus("danger");
    }
  };

  if (showEmailAuth) {
    return (
      <EmailAuth
        onLoginSuccess={onLoginSuccess}
        onEmailRegistration={onEmailRegistration}
        switchToGoogle={() => setShowEmailAuth(false)}
      />
    );
  }

  return (
    <div className="examnest-login-container">
      <div className="examnest-login-card">
        {/* Header Section */}
        <div className="examnest-login-header">
          <div className="examnest-logo">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15L12 18M12 18L9 21M12 18L15 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 12H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="4"
                y="4"
                width="16"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M7 8H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="logo-text">ExamNest</span>
          </div>
          <h1>Welcome to ExamNest</h1>
          <p>Your secure examination platform</p>

          {/* Theme Toggle + Security Indicator */}
          <div className="header-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isDarkMode ? "🌙" : "☀️"}
            </button>
            <div className={`security-indicator ${securityStatus}`} />
          </div>
        </div>

        {/* Login Options */}
        <div className="login-options">
          <button
            onClick={handleGoogleSignIn}
            className="google-signin-btn examnest-btn"
          >
            <svg
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 
                393.2 0 256S110.8 8 248 8c66.8 0 123 
                24.5 166.3 64.9l-67.5 64.9C258.5 52.6 
                94.3 116.6 94.3 256c0 86.5 69.1 
                156.6 153.7 156.6 98.2 0 135-70.4 
                140.8-106.9H248v-85.3h236.1c2.3 
                12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            onClick={() => setShowEmailAuth(true)}
            className="email-signin-btn examnest-btn primary-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4H20C21.1 4 22 4.9 22 
                6V18C22 19.1 21.1 20 20 
                20H4C2.9 20 2 19.1 2 
                18V6C2 4.9 2.9 4 4 4Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M22 6L12 13L2 6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Sign in with Email
          </button>

          <div className="signup-prompt">
            <span>New to ExamNest?</span>
            <button
              onClick={() => setShowEmailAuth(true)}
              className="signup-link"
            >
              Create an account
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="examnest-features">
          <h3>Why Choose ExamNest?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🕒</div>
              <div className="feature-text">
                <strong>Timed Assessments</strong>
                <span>Real exam experience</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <strong>Instant Analytics</strong>
                <span>Detailed performance insights</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">
                <strong>Secure Testing</strong>
                <span>Advanced proctoring</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <strong>Smart Evaluation</strong>
                <span>Accurate scoring system</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;