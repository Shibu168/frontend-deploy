// components/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { auth, sendVerificationEmail } from '../firebase';

const EmailVerification = ({ user, onEmailVerified }) => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    setIsSending(true);
    setError('');
    setMessage('');
    
    try {
      await sendVerificationEmail(user);
      setMessage('Verification email sent! Check your inbox.');
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
      console.error('Error sending verification email:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if email is verified periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        onEmailVerified();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, onEmailVerified]);

  return (
    <div className="email-verification-container">
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.icon}>📧</div>
          <h2 style={styles.title}>Verify Your Email Address</h2>
          <p style={styles.subtitle}>
            We've sent a verification email to: <strong>{user.email}</strong>
          </p>
          <p style={styles.instructions}>
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <div style={styles.resendSection}>
            <p style={styles.resendText}>
                Didn't receive the email? 
            </p>
            <button
              onClick={handleResendVerification}
              disabled={isSending || countdown > 0}
              style={{
                ...styles.resendButton,
                ...(countdown > 0 ? styles.resendButtonDisabled : {})
              }}
            >
              {isSending ? 'Sending...' : 
               countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
            </button>
          </div>

          {message && <div style={styles.successMessage}>{message}</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}

          <div style={styles.tips}>
            <h4>Tips:</h4>
            <ul style={styles.tipsList}>
              <li>Check your spam folder if you don't see the email</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  content: {
    padding: '20px',
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px',
  },
  title: {
    color: '#333',
    marginBottom: '15px',
    fontSize: '28px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '15px',
    fontSize: '16px',
  },
  instructions: {
    color: '#666',
    marginBottom: '30px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  resendSection: {
    marginBottom: '20px',
  },
  resendText: {
    color: '#666',
    marginBottom: '10px',
  },
  resendButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  resendButtonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  successMessage: {
    color: '#4CAF50',
    backgroundColor: '#f0fff0',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #4CAF50',
  },
  errorMessage: {
    color: '#f44336',
    backgroundColor: '#fff0f0',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f44336',
  },
  tips: {
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '20px',
  },
  tipsList: {
    margin: '10px 0',
    paddingLeft: '20px',
  },
};

export default EmailVerification;