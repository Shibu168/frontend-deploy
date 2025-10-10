import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import ExamList from './Teacher/ExamList';
import ExamForm from './Teacher/ExamForm';
import QuestionForm from './Teacher/QuestionForm';
import ResultsView from './Teacher/ResultsView';
import './TeacherDashboard.css';

const TeacherDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('exams');
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

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

  // Get user photo URL
  const getUserPhotoURL = () => {
    return user?.photoURL || null;
  };

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <div className="header-content">
          <h1>Teacher Dashboard</h1>
          <div className="user-profile">
            <div className="user-avatar">
              {getUserPhotoURL() ? (
                <img 
                  src={getUserPhotoURL()} 
                  alt={getUserDisplayName()}
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{getUserDisplayName()}</span>
              <span className="user-role">Teacher</span>
            </div>
          </div>
        </div>
        <div className="logout-container">
          <button
            onClick={handleLogoutClick}
            className="logout-btn"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <span className="loading-spinner"></span>
                Logging out...
              </>
            ) : (
              <>
                <span className="logout-icon">⎋</span>
                Logout
              </>
            )}
          </button>

          {showLogoutConfirm && (
            <div className="confirm-dialog">
              <p className="confirm-text">Are you sure you want to logout?</p>
              <div className="confirm-buttons">
                <button
                  className="confirm-button confirm-no"
                  onClick={handleCancelLogout}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button confirm-yes"
                  onClick={handleConfirmLogout}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <nav className="teacher-nav">
        <button 
          className={`nav-button ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          My Exams
        </button>
        <button 
          className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Exam
        </button>
        {selectedExam && (
          <button 
            className={`nav-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Manage Questions
          </button>
        )}
        {selectedExam && (
          <button 
            className={`nav-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            View Results
          </button>
        )}
      </nav>
      
      <div className="teacher-content">
        <div className="tab-content">
          {activeTab === 'exams' && (
            <ExamList 
              onSelectExam={setSelectedExam}
              onExamSelect={(exam) => {
                setSelectedExam(exam);
                setActiveTab('questions');
              }}
            />
          )}
          
          {activeTab === 'create' && (
            <ExamForm 
              onExamCreated={(exam) => {
                setSelectedExam(exam);
                setActiveTab('questions');
              }}
            />
          )}
          
          {activeTab === 'questions' && selectedExam && (
            <QuestionForm 
              exam={selectedExam}
              onBack={() => setActiveTab('exams')}
            />
          )}
          
          {activeTab === 'results' && selectedExam && (
            <ResultsView 
              exam={selectedExam}
              onBack={() => setActiveTab('exams')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;