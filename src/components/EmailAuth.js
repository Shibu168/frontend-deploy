// components/EmailAuth.js
import React, { useState, useEffect } from 'react';
import { 
  registerWithEmailPassword, 
  signInWithEmailPassword, 
  sendPasswordReset,
  sendVerificationEmail,
  signInWithGoogle,
  linkEmailPasswordToGoogle,
  checkEmailExists,
  trySignInAndGetUserInfo
} from '../firebase';
import './EmailAuth.css';

const EmailAuth = ({ onLoginSuccess, onEmailRegistration, switchToGoogle, onIncompleteRegistration }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState('secure');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [accountRecoveryMode, setAccountRecoveryMode] = useState(null);

  // Security status animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStatus(prev => prev === 'secure' ? 'scanning' : 'secure');
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [password]);

  // Handle existing Firebase user
  const handleExistingFirebaseUser = async (firebaseUser) => {
    console.log('[DEBUG] Handling existing Firebase user:', firebaseUser.email);
    setLoading(true);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      
      if (firebaseUser.emailVerified) {
        if (onIncompleteRegistration) {
          await onIncompleteRegistration(firebaseUser);
        } else {
          onLoginSuccess(idToken, firebaseUser);
        }
      } else {
        await sendVerificationEmail(firebaseUser);
        onEmailRegistration(firebaseUser.email, firebaseUser);
        setMessage(`Verification email sent to ${firebaseUser.email}! Please verify your email to continue.`);
      }
    } catch (error) {
      console.error('Error handling existing Firebase user:', error);
      setError('Error processing your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced registration handler
  const handleRegistration = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    try {
      console.log('[DEBUG] Starting registration for:', email);
      
      // Try to register directly
      const result = await registerWithEmailPassword(email, password);
      const user = result.user;
      
      console.log('[DEBUG] Account created successfully');
      await sendVerificationEmail(user);
      onEmailRegistration(user.email, user);
      
      setMessage(`Verification email sent to ${user.email}! Please check your inbox.`);
    } catch (error) {
      console.error('[DEBUG] Registration error:', error);
      console.error('[DEBUG] Error code:', error.code);
      
      // Handle email already in use
      if (error.code === 'auth/email-already-in-use') {
        await handleExistingEmailScenario();
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  // NEW: Handle the scenario when email already exists
  const handleExistingEmailScenario = async () => {
    console.log('[DEBUG] Handling existing email scenario for:', email);
    
    try {
      // First, try to check sign-in methods
      const methods = await checkEmailExists(email);
      console.log('[DEBUG] Sign-in methods:', methods);
      
      if (methods.length > 0) {
        if (methods.includes('google.com')) {
          setAccountRecoveryMode('LINK_GOOGLE_ACCOUNT');
          setError('This email is already registered with Google. Would you like to add a password to your Google account?');
        } else if (methods.includes('password')) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLogin(true);
        } else {
          setError('An account with this email already exists. Please try signing in with a different method.');
          setIsLogin(true);
        }
        return;
      }
      
      // If methods is empty but Firebase says email exists, try to sign in
      console.log('[DEBUG] Methods empty, trying to sign in to check account...');
      const signInAttempt = await trySignInAndGetUserInfo(email, password);
      
      if (signInAttempt.success) {
        // Account exists and password is correct
        console.log('[DEBUG] Account exists and password is correct');
        const user = signInAttempt.user;
        
        if (!user.emailVerified) {
          await sendVerificationEmail(user);
          setMessage(`Account exists but email not verified. Verification email sent to ${email}. Please verify your email.`);
          onEmailRegistration(user.email, user);
        } else {
          const idToken = await user.getIdToken();
          onLoginSuccess(idToken, user);
        }
      } else {
        // Account exists but password might be wrong or it's a different auth method
        console.log('[DEBUG] Sign in failed:', signInAttempt.error);
        
        if (signInAttempt.error.code === 'auth/wrong-password') {
          setError('An account with this email already exists, but the password is incorrect. Please try signing in or reset your password.');
          setIsLogin(true);
        } else if (signInAttempt.error.code === 'auth/invalid-credential') {
          setError('An account with this email exists but with different authentication. Please try signing in with Google or contact support.');
          setAccountRecoveryMode('UNKNOWN_AUTH_METHOD');
        } else {
          setError('An account with this email already exists. Please try signing in with Google or use a different email.');
          setAccountRecoveryMode('UNKNOWN_AUTH_METHOD');
        }
      }
    } catch (methodsError) {
      console.error('[DEBUG] Error in existing email scenario:', methodsError);
      setError('An account with this email already exists. Please try signing in or use a different email.');
      setIsLogin(true);
    }
  };

  // Handle account linking
  const handleAccountLinking = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[DEBUG] Starting account linking for:', email);
      
      // First sign in with Google
      const googleResult = await signInWithGoogle();
      const googleUser = googleResult.user;
      
      console.log('[DEBUG] Google sign-in successful, linking credentials...');
      
      // Then link the email/password
      await linkEmailPasswordToGoogle(email, password);
      
      console.log('[DEBUG] Account linking successful');
      
      setMessage('Your email and password have been successfully linked to your Google account!');
      
      // Proceed with login
      const idToken = await googleUser.getIdToken();
      onLoginSuccess(idToken, googleUser);
      
      setAccountRecoveryMode(null);
    } catch (error) {
      console.error('[DEBUG] Account linking error:', error);
      if (error.code === 'auth/provider-already-linked') {
        setError('This email is already linked to your Google account. Please sign in with Google.');
      } else if (error.code === 'auth/credential-already-in-use') {
        setError('These credentials are already associated with another account.');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('For security, please sign out and sign in with Google again to link your account.');
      } else {
        setError('Failed to link accounts: ' + (error.message || 'Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    try {
      console.log('[DEBUG] Attempting sign in for:', email);
      const result = await signInWithEmailPassword(email, password);
      const user = result.user;
      
      if (!user.emailVerified) {
        setError('Please verify your email address before signing in. Check your inbox for the verification email.');
        setLoading(false);
        return;
      }
      
      const idToken = await user.getIdToken();
      onLoginSuccess(idToken, user);
    } catch (signInError) {
      console.error('[DEBUG] Sign in error:', signInError);
      
      if (signInError.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (signInError.code === 'auth/user-not-found') {
        setError('No account found with this email. Please create a new account.');
        setIsLogin(false);
      } else if (signInError.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or reset your password.');
      } else if (signInError.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else {
        setError(signInError.message || 'Sign in failed. Please try again.');
      }
      throw signInError; // Re-throw to be caught by main handler
    }
  };

  // FIXED: Main submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    setAccountRecoveryMode(null);

    try {
      if (isLogin) {
        await handleSignIn();
      } else {
        await handleRegistration();
      }
    } catch (error) {
      // Error already handled in sub-functions
      console.error('[DEBUG] Main handler error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return '#ff4757';
    if (passwordStrength <= 50) return '#ffa502';
    if (passwordStrength <= 75) return '#2ed573';
    return '#00ff96';
  };

  // Handle unknown auth method
  const handleUnknownAuthRecovery = () => {
    setAccountRecoveryMode(null);
    setError('');
    setEmail('');
    setIsLogin(true);
  };

  return (
    <div className="emailauth-container">
      <div className="emailauth-card">
        {/* Security Indicator */}
        <div className={`security-indicator ${securityStatus}`}></div>
        
        {/* Header */}
        <div className="emailauth-header">
          <div className="auth-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            </svg>
          </div>
          <h2>{isLogin ? 'Secure Email Authentication' : 'Create Secure Account'}</h2>
          <p>{isLogin ? 'Enterprise-grade security' : 'Join the secure platform'}</p>
        </div>

        {/* Back Button */}
        <button onClick={switchToGoogle} className="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Main Login
        </button>

        {/* Account Recovery Options */}
        {accountRecoveryMode === 'LINK_GOOGLE_ACCOUNT' && (
          <div className="recovery-option">
            <div className="message-icon">🔄</div>
            <div>
              <p>This email is registered with Google. You can:</p>
              <button 
                onClick={handleAccountLinking}
                className="google-recovery-btn"
                disabled={loading}
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                </svg>
                {loading ? 'Linking...' : 'Link Password to Google Account'}
              </button>
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                <button 
                  onClick={() => {
                    setAccountRecoveryMode(null);
                    setError('');
                    setEmail('');
                  }}
                  className="cancel-link"
                >
                  Use different email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unknown Auth Method Recovery */}
        {accountRecoveryMode === 'UNKNOWN_AUTH_METHOD' && (
          <div className="recovery-option">
            <div className="message-icon">🔍</div>
            <div>
              <p>We detected an account issue with this email. Please try:</p>
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '10px' }}>
                <button 
                  onClick={() => {
                    setAccountRecoveryMode(null);
                    setIsLogin(true);
                    setError('Please try signing in with your existing credentials.');
                  }}
                  className="google-recovery-btn"
                >
                  Try Signing In Again
                </button>
                <button 
                  onClick={handlePasswordReset}
                  className="cancel-link"
                  disabled={loading}
                >
                  Reset Password
                </button>
                <button 
                  onClick={handleUnknownAuthRecovery}
                  className="cancel-link"
                >
                  Use Different Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Message */}
        {!isLogin && !accountRecoveryMode && (
          <div className="recovery-message">
            <div className="message-icon">ℹ️</div>
            <div>
              <p>Already started registration? 
                <button 
                  onClick={() => setIsLogin(true)} 
                  className="recovery-link"
                >
                  Sign in here
                </button> to continue.
              </p>
            </div>
          </div>
        )}
        
        {/* Form - Only show if not in recovery mode */}
        {!accountRecoveryMode && (
          <form onSubmit={handleSubmit} className="emailauth-form">
            <div className="form-group">
              <label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your enterprise email"
                className="secure-input"
              />
            </div>
            
            <div className="form-group">
              <label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter secure password"
                  className="secure-input"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {!isLogin && password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  </svg>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="secure-input"
                  minLength="6"
                />
              </div>
            )}
            
            {/* Messages */}
            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {error}
              </div>
            )}
            
            {message && (
              <div className="success-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12A10 10 0 1 1 5.93 7.01" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {message}
              </div>
            )}
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H15" stroke="currentColor" strokeWidth="2"/>
                    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M15 12H3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {isLogin ? 'Authenticate' : 'Create Secure Account'}
                </>
              )}
            </button>
          </form>
        )}
        
        {/* Auth Options */}
        {!accountRecoveryMode && (
          <div className="auth-options">
            {isLogin ? (
              <>
                <div className="auth-switch">
                  <span>New to ExamNest?</span>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className="switch-link"
                  >
                    Create Account
                  </button>
                </div>
                <div className="password-reset">
                  <button 
                    onClick={handlePasswordReset}
                    className="reset-link"
                    disabled={loading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12A9 9 0 0 0 12 21A9 9 0 0 0 21 12A9 9 0 0 0 12 3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Forgot Password?
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-switch">
                <span>Already have an account?</span>
                <button 
                  onClick={() => setIsLogin(true)}
                  className="switch-link"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Footer */}
        <div className="security-footer">
          <div className="security-info">
            <span className="security-badge">🔐 256-bit SSL</span>
            <span className="security-badge">🛡️ Encrypted</span>
            <span className="security-badge">⚡ Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAuth;