// PrivateExamAccess.js - Fixed version
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidToken, isTokenValid, clearAuthData } from '../../utils/authHelpers';

const PrivateExamAccess = ({ user, onLogin }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Remove the local getValidToken function since we're importing it
  // Use the imported functions directly

  useEffect(() => {
    const accessPrivateExam = async () => {
      // Check if token is provided
      if (!token || token === 'undefined') {
        setError('Invalid exam link. Please check the URL and try again.');
        setLoading(false);
        return;
      }

      // Use the imported getValidToken function instead of tokenManager
      const jwtToken = getValidToken();
      console.log('[DEBUG] PrivateExamAccess - JWT Token:', jwtToken);
      
      // Use the imported isTokenValid function
      if (!jwtToken || !isTokenValid(jwtToken)) {
        console.log('No valid token found, redirecting to login');
        navigate('/login', { 
          state: { 
            returnUrl: `/exam/${token}`,
            message: 'Please login to access the private exam'
          } 
        });
        return;
      }

      // If we have a user already, proceed to fetch exam
      if (user) {
        await fetchPrivateExam(jwtToken);
      } else {
        // If no user but have token, try to set user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser && onLogin) {
          try {
            const userData = JSON.parse(storedUser);
            onLogin(userData);
            // Wait a moment for state update, then fetch exam
            setTimeout(() => fetchPrivateExam(jwtToken), 100);
          } catch (e) {
            console.error('Error parsing user data:', e);
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      }
    };

    accessPrivateExam();
  }, [token, navigate, onLogin, user]);

  const fetchPrivateExam = async (jwtToken) => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      
      console.log('Fetching private exam with shareable token:', token);
      console.log('Using JWT token:', jwtToken ? 'Token exists' : 'No token');
      
      // Validate token
      if (!jwtToken || jwtToken === 'null' || jwtToken === 'undefined') {
        throw new Error('Invalid authentication token');
      }

      const response = await fetch(`${API_BASE}/api/student/exams/token/${token}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        // Token expired or invalid
        clearAuthData(); // Use the imported function
        navigate('/login', { 
          state: { 
            returnUrl: `/exam/${token}`,
            message: 'Session expired. Please login again.'
          } 
        });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Exam data received:', data);
        setExam(data);
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to access private exam' };
        }
        console.error('Error response:', errorData);
        setError(errorData.error || 'Failed to access private exam. Please check if the exam link is correct.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    const jwtToken = getValidToken(); // Use the imported function
    if (jwtToken) {
      await fetchPrivateExam(jwtToken);
    } else {
      navigate('/login', { 
        state: { 
          returnUrl: `/exam/${token}`,
          message: 'Please login again'
        } 
      });
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { 
      state: { 
        returnUrl: `/exam/${token}`,
        message: 'Please login to access this exam'
      } 
    });
  };

  // ... rest of your component remains the same
  if (loading) {
    return (
      <div className="private-exam-loading">
        <div className="loading-spinner"></div>
        <p>Loading private exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="private-exam-error">
        <div className="error-message">
          <h3>❌ {error}</h3>
          <div className="error-details">
            <p>If you believe this is an error, please:</p>
            <ul>
              <li>Check that the exam link is correct</li>
              <li>Ensure you're logged in with the correct account</li>
              <li>Contact your teacher if the problem persists</li>
            </ul>
          </div>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={handleLoginRedirect} className="btn btn-secondary">
              Login Again
            </button>
            <button 
              onClick={() => navigate('/student-dashboard')} 
              className="btn btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || !exam.exam) {
    return (
      <div className="private-exam-error">
        <div className="error-message">
          <h3>❌ Exam data not available</h3>
          <button onClick={handleRetry} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="private-exam-access">
      <div className="container">
        <div className="exam-card">
          <div className="exam-header">
            <h1>{exam.exam.title}</h1>
            <span className="private-badge">Private Exam</span>
          </div>
          
          <p className="exam-description">{exam.exam.description}</p>
          
          <div className="exam-details">
            <div className="detail-item">
              <span className="label">Duration:</span>
              <span className="value">{exam.exam.duration_minutes} minutes</span>
            </div>
            <div className="detail-item">
              <span className="label">Starts:</span>
              <span className="value">{new Date(exam.exam.start_time).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Ends:</span>
              <span className="value">{new Date(exam.exam.end_time).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Questions:</span>
              <span className="value">{exam.questions ? exam.questions.length : 0}</span>
            </div>
          </div>

          <div className="exam-instructions">
            <h3>📝 Exam Instructions</h3>
            <ul>
              <li>You have <strong>{exam.exam.duration_minutes} minutes</strong> to complete this exam</li>
              <li>The exam will auto-submit when time expires</li>
              <li>You cannot pause or restart the exam once begun</li>
              <li>Ensure you have a stable internet connection</li>
              <li>Do not refresh the page or navigate away during the exam</li>
            </ul>
          </div>

          <div className="exam-actions">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="btn btn-secondary"
            >
              Back to Dashboard
            </button>
            // In PrivateExamAccess.js - Update the Start Exam button
            <button 
              onClick={() => {
                console.log('Navigating to exam interface with data:', exam);
                navigate('/exam-interface', { 
                  state: { 
                    examData: exam,
                    isPrivateExam: true
                  } 
                });
              }}
              className="btn btn-primary start-exam-btn"
            >
              Start Exam Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateExamAccess;