import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ExamInterface = ({ exam, onExamComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  // Proctoring states
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const proctoringRef = useRef({
    tabSwitchCount: 0,
    lastSwitchTime: null,
    isMonitoring: false
  });

  // Enhanced duration calculation with debugging
  const getExamDuration = () => {
    if (!exam && !location.state?.examData) {
      console.log('No exam data available, using default 60 minutes');
      return 60;
    }
    
    const examSource = exam || location.state?.examData;
    
    // Check all possible paths for duration
    const possiblePaths = [
      examSource?.exam?.duration_minutes,
      examSource?.duration_minutes,
      examSource?.examDetails?.duration_minutes,
      examSource?.duration,
      examSource?.exam?.duration,
      examSource?.time_limit,
      examSource?.exam?.time_limit
    ];
    
    console.log('Possible duration values:', possiblePaths);
    
    for (const duration of possiblePaths) {
      if (duration !== undefined && duration !== null) {
        const parsed = parseInt(duration);
        if (!isNaN(parsed)) {
          console.log('Using duration from value:', duration, 'parsed as:', parsed);
          return parsed;
        }
      }
    }
    
    console.log('No valid duration found, using default 60 minutes');
    return 60;
  };

  const examFromState = location.state?.examData;
  const examDuration = getExamDuration();
  
  // Add validation to ensure duration is reasonable
  const validatedDuration = examDuration > 0 && examDuration <= 600 ? examDuration : 60;
  const initialTimeLeft = validatedDuration * 60;
  
  console.log('Final duration settings:', {
    rawDuration: examDuration,
    validatedDuration: validatedDuration,
    initialTimeLeft: initialTimeLeft,
    calculatedMinutes: initialTimeLeft / 60
  });

  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptData, setAttemptData] = useState(null);

  // Proctoring constants
  const MAX_TAB_SWITCHES = 3;

  // Sync answers ref with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    console.log('ExamInterface - Location state:', location.state);
    console.log('ExamInterface - Exam data from state:', examFromState);
    console.log('ExamInterface - Current examData state:', examData);
    console.log('ExamInterface - Attempt data:', attemptData);
  }, [location.state, examFromState, examData, attemptData]);

  // Debug effect to track duration issues
  useEffect(() => {
    if (examData) {
      console.log('=== EXAM CONFIGURATION DEBUG ===');
      console.log('Exam Title:', getExamTitle());
      console.log('Raw Duration from data:', examDuration, 'minutes');
      console.log('Validated Duration:', validatedDuration, 'minutes');
      console.log('Time Left in seconds:', timeLeft);
      console.log('Time Left in minutes:', timeLeft / 60);
      console.log('Questions Count:', getQuestions().length);
      console.log('Tab Switch Count:', tabSwitchCount);
      console.log('Full Screen Status:', isFullScreen);
      console.log('Exam Paused:', isPaused);
      console.log('Attempt Data:', attemptData);
      console.log('==========================');
    }
  }, [examData, validatedDuration, timeLeft, examDuration, tabSwitchCount, isFullScreen, isPaused, attemptData]);

  // Handle exam data from location state or props
  useEffect(() => {
    if (examFromState && !examData) {
      console.log('Setting exam data from location state');
      setExamData(examFromState);
      const duration = getExamDuration(examFromState);
      setTimeLeft(duration * 60);
      setLoading(false);
      
      // Extract attempt data from exam data
      if (examFromState.attemptId || examFromState.sessionToken) {
        setAttemptData({
          attemptId: examFromState.attemptId,
          sessionToken: examFromState.sessionToken
        });
      }
    }
    
    if (exam && !examData) {
      console.log('Exam data received:', exam);
      setExamData(exam);
      const duration = getExamDuration();
      setTimeLeft(duration * 60);
      
      // Extract attempt data from exam data
      if (exam.attemptId || exam.sessionToken) {
        setAttemptData({
          attemptId: exam.attemptId,
          sessionToken: exam.sessionToken
        });
      }
    }
  }, [exam, examFromState, examData]);

  // Enhanced Full Screen Detection and Enforcement
  useEffect(() => {
    const handleFullScreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      
      const newFullScreenStatus = !!fullscreenElement;
      setIsFullScreen(newFullScreenStatus);
      
      if (examStarted) {
        if (!newFullScreenStatus) {
          // User exited full screen - pause exam and show warning
          setIsPaused(true);
          setShowFullScreenModal(true);
          console.log('Exam paused due to full screen exit');
        } else {
          // User entered full screen - resume exam
          setIsPaused(false);
          setShowFullScreenModal(false);
          console.log('Exam resumed - full screen active');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, [examStarted]);

  // Enhanced Proctoring: Tab switch detection and full screen enforcement
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        proctoringRef.current.tabSwitchCount = newCount;
        proctoringRef.current.lastSwitchTime = new Date();
        
        console.log(`Tab switch detected! Count: ${newCount}/${MAX_TAB_SWITCHES}`);
        
        if (newCount <= MAX_TAB_SWITCHES) {
          setShowWarningModal(true);
          
          // Auto-hide warning after 5 seconds
          setTimeout(() => {
            setShowWarningModal(false);
          }, 5000);
        }
        
        // Auto-submit if exceeded max switches
        if (newCount > MAX_TAB_SWITCHES) {
          handleProctoringViolation('exceeded_tab_switch_limit');
        }
      }
    };

    // Key events to detect attempts to open developer tools
    const handleKeyDown = (e) => {
      // Detect F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
          (e.ctrlKey && e.key === 'U') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setShowWarningModal(true);
        
        if (newCount > MAX_TAB_SWITCHES) {
          handleProctoringViolation('developer_tools_attempt');
        }
      }
    };

    // Right-click disable to prevent context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      const newCount = tabSwitchCount + 1;
      setTabSwitchCount(newCount);
      setShowWarningModal(true);
      
      if (newCount > MAX_TAB_SWITCHES) {
        handleProctoringViolation('right_click_attempt');
      }
    };

    // Start monitoring
    proctoringRef.current.isMonitoring = true;
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Request full screen when exam starts
    if (examStarted && !isFullScreen) {
      requestFullScreen();
    }

    return () => {
      proctoringRef.current.isMonitoring = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStarted, tabSwitchCount, isFullScreen]);

  // Enhanced Timer with Pause/Resume functionality
  useEffect(() => {
    if (!examStarted || !examData || isPaused) {
      // Clear timer if exam not started, no data, or paused
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [examStarted, examData, isPaused]);

  // Request full screen function
  const requestFullScreen = () => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
        // If full screen fails, show modal and pause exam
        setIsPaused(true);
        setShowFullScreenModal(true);
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen().catch(err => {
        console.log('Full screen request failed:', err);
        setIsPaused(true);
        setShowFullScreenModal(true);
      });
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
        setIsPaused(true);
        setShowFullScreenModal(true);
      });
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
        setIsPaused(true);
        setShowFullScreenModal(true);
      });
    } else {
      // Full screen not supported
      console.log('Full screen not supported by browser');
      setIsPaused(true);
      setShowFullScreenModal(true);
    }
  };

  // Resume exam when full screen is activated
  const resumeExam = () => {
    requestFullScreen();
  };

  // Handle proctoring violations
  const handleProctoringViolation = (violationType) => {
    console.log(`Proctoring violation: ${violationType}`);
    
    const violationMessages = {
      'exceeded_tab_switch_limit': 'You have exceeded the maximum allowed tab switches. Your exam will be submitted automatically.',
      'developer_tools_attempt': 'Attempt to open developer tools detected. Your exam will be submitted.',
      'right_click_attempt': 'Right-click attempt detected. Your exam will be submitted.'
    };
    
    alert(`Proctoring Violation!\n${violationMessages[violationType]}\n\nTab switches: ${tabSwitchCount}/${MAX_TAB_SWITCHES}`);
    
    // Submit exam with violation flag
    handleSubmit(true, violationType);
  };

  const getQuestions = () => {
    if (!examData) return [];
    return examData.questions || 
           examData.exam?.questions || 
           examData.questionSet || 
           [];
  };

  const getExamTitle = () => {
    if (!examData) return 'Exam';
    return examData.exam?.title || examData.title || 'Exam';
  };

  const getExamDescription = () => {
    if (!examData) return 'No description available';
    return examData.exam?.description || examData.description || 'No description available';
  };

  const getExamId = () => {
    if (!examData) return null;
    return examData.exam?.id || examData.id;
  };

  // NEW: Function to create or get attempt data
// In the initializeExamAttempt function, change from POST to GET
  const initializeExamAttempt = async () => {
    if (!examData) {
      alert('Exam data is not available. Please try again.');
      return false;
    }

    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      const examId = getExamId();

      if (!examId) {
        throw new Error('Exam ID not available');
      }

      console.log('Initializing exam attempt for exam ID:', examId);

      const response = await fetch(`${API_BASE}/api/student/exams/${examId}/start`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Exam attempt started:', result);
        
        // Extract attempt data from response - handle different response structures
        const attemptInfo = result.attempt || result;
        
        setAttemptData({
          attemptId: attemptInfo.id || attemptInfo.attemptId,
          sessionToken: attemptInfo.token || attemptInfo.sessionToken
        });
        
        return true;
      } else {
        const errorText = await response.text();
        console.error('Start exam error response:', errorText);
        throw new Error('Failed to start exam attempt');
      }
    } catch (error) {
      console.error('Error starting exam attempt:', error);
      alert('Failed to start exam: ' + error.message);
      return false;
    }
  };

  const startExam = async () => {
    if (!examData || getQuestions().length === 0) {
      alert('Exam data is not available. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Initialize exam attempt if not already present
      if (!attemptData) {
        const attemptInitialized = await initializeExamAttempt();
        if (!attemptInitialized) {
          setLoading(false);
          return;
        }
      }
      
      // Initialize proctoring
      setTabSwitchCount(0);
      proctoringRef.current = {
        tabSwitchCount: 0,
        lastSwitchTime: null,
        isMonitoring: true
      };
      
      setExamStarted(true);
      
      // Attempt to enter full screen
      setTimeout(() => {
        requestFullScreen();
      }, 500);
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    const questions = getQuestions();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Safe navigation function
  const navigateToDashboard = () => {
    try {
      // Exit full screen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log('Exit fullscreen failed:', err));
      }
      
      // Try using the onBack prop first (if provided by parent)
      if (onBack) {
        onBack();
      } else {
        // Fallback to React Router navigation
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Final fallback: hard redirect
      window.location.href = '/dashboard';
    }
  };
  const handleSubmit = async (isAutoSubmit = false, violationType = null) => {
    if (!examData) {
      alert('Exam data not available. Cannot submit.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      const examId = getExamId();
      
      if (!examId) {
        throw new Error('Exam ID not available');
      }

      // Check if we have attempt data
      if (!attemptData || !attemptData.attemptId) {
        throw new Error('Exam attempt not properly initialized. Please contact support.');
      }

      // Use the ref to get the latest answers
      const currentAnswers = answersRef.current;
      
      console.log('Submitting exam with data:', {
        examId: examId,
        attemptId: attemptData.attemptId,
        sessionToken: attemptData.sessionToken,
        answersCount: Object.keys(currentAnswers).length,
        isAutoSubmit: isAutoSubmit,
        violationType: violationType
      });

      const submissionData = {
        attemptId: attemptData.attemptId,
        sessionToken: attemptData.sessionToken, // This might be undefined for old attempts
        answers: Object.entries(currentAnswers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answer: answer
        })),
        isAutoSubmit: isAutoSubmit,
        proctoringData: {
          tabSwitchCount: tabSwitchCount,
          violationType: violationType,
          finalTimeLeft: timeLeft,
          fullScreenStatus: isFullScreen,
          examPaused: isPaused
        }
      };

      console.log('Submission data being sent:', submissionData);

      const response = await fetch(`${API_BASE}/api/student/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        let message = '';
        
        if (violationType) {
          message = `Exam submitted due to proctoring violation. Score: ${result.score || result.totalMarks}`;
        } else if (isAutoSubmit) {
          message = `Time's up! Exam auto-submitted. Score: ${result.score || result.totalMarks}`;
        } else {
          message = `Exam submitted successfully! Score: ${result.score || result.totalMarks}`;
        }
        
        alert(message);
        
        // Call the parent callback if provided
        if (onExamComplete) {
          onExamComplete(result);
        }
        
        // Navigate back to dashboard after successful submission
        navigateToDashboard();
        
      } else {
        const errorText = await response.text();
        console.error('Backend submission error:', errorText);
        throw new Error('Failed to submit exam. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error submitting exam: ' + error.message);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };


  const handleAutoSubmit = () => {
    console.log('Time is up! Auto-submitting exam...');
    console.log('Current answers ref:', answersRef.current);
    console.log('Tab switch count:', tabSwitchCount);
    console.log('Full screen status:', isFullScreen);
    console.log('Attempt data:', attemptData);
    
    // Get the latest answers from ref to ensure we have all selected options
    const currentAnswers = answersRef.current;
    const answeredQuestions = Object.keys(currentAnswers).length;
    const totalQuestions = getQuestions().length;
    
    console.log(`Auto-submitting: ${answeredQuestions}/${totalQuestions} questions answered`);
    
    // Always submit, even if no answers were selected
    handleSubmit(true);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
  };

  const questions = getQuestions();

  // Show loading state while waiting for exam data
  if (!examData) {
    return (
      <div className="exam-loading">
        <h2>Loading Exam...</h2>
        <p>Please wait while we load your exam data.</p>
        <div className="loading-spinner"></div>
        <button onClick={navigateToDashboard} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-error">
        <h2>Exam Configuration Error</h2>
        <p>No questions found for this exam. Please contact your instructor.</p>
        <button onClick={navigateToDashboard} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="exam-instructions">
        <h2>Exam Instructions</h2>
        <div className="instructions-content">
          <h3>{getExamTitle()}</h3>
          <p>{getExamDescription()}</p>
          
          <div className="exam-info">
            <p><strong>Duration:</strong> {validatedDuration} minutes</p>
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Full Screen:</strong> <span style={{color: 'red', fontWeight: 'bold'}}>MANDATORY</span></p>
            <p><strong>Proctoring:</strong> Enabled (Max {MAX_TAB_SWITCHES} tab switches allowed)</p>
          </div>

          <div className="instructions-list">
            <h4>Important Instructions:</h4>
            <ul>
              <li>You have <strong>{validatedDuration} minutes</strong> to complete the exam</li>
              <li><strong style={{color: 'red'}}>FULL SCREEN IS MANDATORY:</strong> Exam will pause if you exit full screen</li>
              <li><strong>Proctoring is active:</strong> Maximum {MAX_TAB_SWITCHES} tab switches allowed</li>
              <li>Do not switch tabs, open new windows, or use developer tools</li>
              <li>The exam will auto-submit when time expires or proctoring rules are violated</li>
              <li>All selected answers will be submitted automatically, even if incomplete</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button onClick={navigateToDashboard} className="btn btn-secondary">
              Back to Dashboard
            </button>
            <button onClick={startExam} disabled={loading} className="btn btn-primary">
              {loading ? 'Starting Exam...' : 'Start Exam in Full Screen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="exam-error">
        <h2>Error Loading Question</h2>
        <p>Unable to load question data. Please try again.</p>
        <button onClick={navigateToDashboard} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="exam-interface">
      {/* Full Screen Warning Modal */}
      {showFullScreenModal && (
        <div className="full-screen-warning-modal">
          <div className="warning-content full-screen-warning">
            <h3>⚠️ Full Screen Required</h3>
            <p>
              <strong>Exam is PAUSED!</strong>
            </p>
            <p>
              You must be in full screen mode to continue the exam.
            </p>
            <p className="warning-message">
              Time is paused until you return to full screen mode.
            </p>
            <div className="warning-actions">
              <button onClick={resumeExam} className="btn btn-primary">
                Resume Full Screen & Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Warning Modal */}
      {showWarningModal && (
        <div className="proctoring-warning-modal">
          <div className="warning-content">
            <h3>⚠️ Proctoring Warning</h3>
            <p>
              <strong>Tab Switch Detected!</strong>
            </p>
            <p>
              You have switched tabs {tabSwitchCount} out of {MAX_TAB_SWITCHES} allowed times.
            </p>
            <p className="warning-message">
              {tabSwitchCount >= MAX_TAB_SWITCHES 
                ? "This is your final warning! Next violation will auto-submit your exam."
                : "Please remain on this tab for the duration of the exam."}
            </p>
            <button onClick={closeWarningModal} className="btn btn-warning">
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Proctoring Status Bar */}
      <div className="proctoring-status">
        <div className="status-item">
          <span className="status-label">Tab Switches:</span>
          <span className={`status-count ${tabSwitchCount >= MAX_TAB_SWITCHES ? 'warning' : ''}`}>
            {tabSwitchCount} / {MAX_TAB_SWITCHES}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Full Screen:</span>
          <span className={`status-count ${!isFullScreen ? 'warning' : 'success'}`}>
            {isFullScreen ? 'Active' : 'Not Active'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Exam Status:</span>
          <span className={`status-count ${isPaused ? 'warning' : 'success'}`}>
            {isPaused ? 'PAUSED' : 'Running'}
          </span>
        </div>
      </div>

      <div className="exam-header">
        <h2>{getExamTitle()}</h2>
        <div className="exam-timer">
          {isPaused ? (
            <span style={{color: 'orange', fontWeight: 'bold'}}>⏸️ EXAM PAUSED - Time: {formatTime(timeLeft)}</span>
          ) : (
            <>
              Time Left: {formatTime(timeLeft)}
              {timeLeft <= 60 && <span className="time-warning"> (Hurry!)</span>}
            </>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
        <div className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
          {` (${Object.keys(answers).length} answered)`}
          {isPaused && <span style={{color: 'orange', marginLeft: '10px'}}>⏸️ PAUSED</span>}
        </div>
      </div>

      <div className="question-container">
        <div className="question-header">
          <h3>Question {currentQuestionIndex + 1}</h3>
          {isPaused && (
            <div className="paused-overlay">
              <p>Exam is paused. Return to full screen to continue.</p>
            </div>
          )}
        </div>
        
        <div className="question-text">
          <p>{currentQuestion.question_text}</p>
          {currentQuestion.question_image && (
            <img 
              src={currentQuestion.question_image} 
              alt="Question illustration" 
              className="question-image"
            />
          )}
        </div>

        <div className="options-container">
          {currentQuestion.options && Object.entries(currentQuestion.options).map(([key, value]) => (
            <label key={key} className="option-label">
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={key}
                checked={answers[currentQuestion.id] === key}
                onChange={() => handleAnswerSelect(currentQuestion.id, key)}
                disabled={isPaused}
              />
              <span className="option-text">{value}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isPaused}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        <div className="question-counter">
          {currentQuestionIndex + 1} / {questions.length}
          {isPaused && <span style={{color: 'orange'}}> (Paused)</span>}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button 
            onClick={() => handleSubmit(false)}
            disabled={loading || isSubmitting || isPaused}
            className="btn btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit Exam'}
          </button>
        ) : (
          <button 
            onClick={handleNext} 
            disabled={isPaused}
            className="btn btn-primary"
          >
            Next
          </button>
        )}
      </div>

      <div className="quick-navigation">
        <h4>Questions:</h4>
        <div className="question-dots">
          {questions.map((question, index) => (
            <button
              key={index}
              className={`dot ${index === currentQuestionIndex ? 'active' : ''} ${
                answers[question.id] ? 'answered' : ''
              }`}
              onClick={() => !isPaused && setCurrentQuestionIndex(index)}
              disabled={isPaused}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Reminder Footer */}
      {!isFullScreen && examStarted && (
        <div className="full-screen-reminder">
          <div className="reminder-content">
            <p>⚠️ <strong>Full Screen Required:</strong> Please return to full screen mode to continue your exam.</p>
            <button onClick={resumeExam} className="btn btn-warning">
              Resume Full Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface;