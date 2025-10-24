import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ExamInterface.css';
import './ProgressTab.css';

// Progress Tab Component
const ProgressTab = ({ 
  examData, 
  answers, 
  currentSectionIndex, 
  currentQuestionIndex,
  isSectionWise = false,
  visitedQuestions = [] 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);

  // Calculate progress data
  const calculateProgress = () => {
    if (!examData) return null;

    if (isSectionWise) {
      const sections = examData.sections || examData.exam?.sections || [];
      return sections.map((section, index) => {
        const sectionQuestions = section.questions || [];
        const answered = sectionQuestions.filter(q => answers[q.id]).length;
        const visited = sectionQuestions.filter(q => 
          visitedQuestions.includes(q.id) && !answers[q.id]
        ).length;
        const unanswered = sectionQuestions.length - answered - visited;

        return {
          id: section.id,
          name: section.name,
          total: sectionQuestions.length,
          answered,
          visited,
          unanswered,
          progress: sectionQuestions.length > 0 ? (answered / sectionQuestions.length) * 100 : 0
        };
      });
    } else {
      // Linear exam progress
      const questions = examData.questions || examData.exam?.questions || [];
      const answered = Object.keys(answers).length;
      const visited = visitedQuestions.filter(qId => !answers[qId]).length;
      const unanswered = questions.length - answered - visited;

      return {
        total: questions.length,
        answered,
        visited,
        unanswered,
        progress: questions.length > 0 ? (answered / questions.length) * 100 : 0
      };
    }
  };

  const progressData = calculateProgress();
  const isFullScreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  // Auto-expand in full screen, collapse when not
  useEffect(() => {
    setIsExpanded(isFullScreen);
  }, [isFullScreen]);

  // Set default selected section for section-wise exams
  useEffect(() => {
    if (isSectionWise && progressData && progressData.length > 0) {
      setSelectedSection(currentSectionIndex);
    }
  }, [isSectionWise, progressData, currentSectionIndex]);

  if (!progressData) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getSectionProgress = (section) => (
    <div className="section-progress-details">
      <div className="progress-row">
        <span className="progress-label">Answered:</span>
        <span className="progress-count answered">
          {section.answered}/{section.total}
        </span>
      </div>
      <div className="progress-row">
        <span className="progress-label">Visited:</span>
        <span className="progress-count visited">
          {section.visited}/{section.total}
        </span>
      </div>
      <div className="progress-row">
        <span className="progress-label">Unanswered:</span>
        <span className="progress-count unanswered">
          {section.unanswered}/{section.total}
        </span>
      </div>
      <div className="progress-bar-mini">
        <div 
          className="progress-fill-mini"
          style={{ width: `${section.progress}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className={`progress-tab ${isExpanded ? 'expanded' : 'collapsed'} ${isFullScreen ? 'full-screen' : ''}`}>
      {/* Header */}
      <div className="progress-tab-header" onClick={toggleExpand}>
        <div className="progress-tab-title">
          <span className="progress-icon">📊</span>
          {isExpanded && <span>Exam Progress</span>}
        </div>
        <div className="progress-tab-actions">
          {isExpanded && (
            <span className="progress-percentage">
              {isSectionWise 
                ? `${Math.round(progressData.reduce((acc, section) => acc + section.answered, 0) / progressData.reduce((acc, section) => acc + section.total, 0) * 100)}%`
                : `${Math.round(progressData.progress)}%`
              }
            </span>
          )}
          <button className="progress-toggle-btn">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="progress-tab-content">
          {isSectionWise ? (
            // Section-wise progress
            <div className="section-wise-progress">
              <div className="section-selector">
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(parseInt(e.target.value))}
                  className="section-dropdown"
                >
                  {progressData.map((section, index) => (
                    <option key={section.id} value={index}>
                      {section.name} ({section.answered}/{section.total})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedSection !== null && progressData[selectedSection] && (
                <div className="selected-section-progress">
                  <h4>{progressData[selectedSection].name}</h4>
                  {getSectionProgress(progressData[selectedSection])}
                </div>
              )}

              {/* Overall summary */}
              <div className="overall-summary">
                <h5>Overall Progress</h5>
                <div className="progress-row">
                  <span className="progress-label">Total Answered:</span>
                  <span className="progress-count answered">
                    {progressData.reduce((acc, section) => acc + section.answered, 0)}/
                    {progressData.reduce((acc, section) => acc + section.total, 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Linear exam progress
            <div className="linear-progress">
              {getSectionProgress(progressData)}
            </div>
          )}

          {/* Visual Progress Indicators */}
          <div className="progress-visual">
            <div className="progress-legend">
              <div className="legend-item">
                <span className="legend-color answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-color visited"></span>
                <span>Visited</span>
              </div>
              <div className="legend-item">
                <span className="legend-color unanswered"></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact view when collapsed */}
      {!isExpanded && (
        <div className="progress-tab-compact">
          <span className="compact-progress">
            {isSectionWise 
              ? `${progressData.reduce((acc, section) => acc + section.answered, 0)}/${progressData.reduce((acc, section) => acc + section.total, 0)}`
              : `${progressData.answered}/${progressData.total}`
            }
          </span>
        </div>
      )}
    </div>
  );
};

// Submission Confirmation Component
const SubmissionConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  progressData,
  isSectionWise
}) => {
  if (!isOpen) return null;

  const renderProgressSummary = () => {
    if (isSectionWise && Array.isArray(progressData)) {
      return (
        <div className="section-submission-summary">
          <h4>Section-wise Progress</h4>
          {progressData.map((section, index) => (
            <div key={section.id} className="section-summary-item">
              <div className="section-summary-header">
                <span className="section-name">{section.name}</span>
                <span className="section-progress">
                  {section.answered}/{section.total} answered
                </span>
              </div>
              <div className="section-details">
                <span className="progress-detail answered">
                  ✅ {section.answered} Answered
                </span>
                <span className="progress-detail visited">
                  🔶 {section.visited} Visited
                </span>
                <span className="progress-detail unanswered">
                  ❌ {section.unanswered} Unanswered
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (progressData) {
      return (
        <div className="linear-submission-summary">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-label">Total Questions:</span>
              <span className="stat-value">{progressData.total}</span>
            </div>
            <div className="stat-item answered">
              <span className="stat-label">Answered:</span>
              <span className="stat-value">{progressData.answered}</span>
            </div>
            <div className="stat-item visited">
              <span className="stat-label">Visited but Unanswered:</span>
              <span className="stat-value">{progressData.visited}</span>
            </div>
            <div className="stat-item unanswered">
              <span className="stat-label">Unanswered:</span>
              <span className="stat-value">{progressData.unanswered}</span>
            </div>
          </div>
          <div className="progress-percentage-final">
            Completion: {Math.round(progressData.progress)}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="submission-confirmation-overlay">
      <div className="submission-confirmation-modal">
        <div className="confirmation-header">
          <h3>Submit Exam</h3>
          <p>Please review your progress before final submission</p>
        </div>
        
        <div className="confirmation-content">
          {renderProgressSummary()}
          
          <div className="warning-message">
            ⚠️ Once submitted, you cannot change your answers. This action is irreversible.
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="btn btn-primary"
          >
            Confirm Submission
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Exam Interface Component
const ExamInterface = ({ exam, onExamComplete, onBack }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState([]);
  const [submittedSections, setSubmittedSections] = useState([]);
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);
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

  // Track visited questions
  useEffect(() => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion?.id && !visitedQuestions.includes(currentQuestion.id)) {
      setVisitedQuestions(prev => [...prev, currentQuestion.id]);
    }
  }, [currentQuestionIndex, currentSectionIndex]);

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

  // SIMPLE Full Screen Detection - This is the key fix
  useEffect(() => {
    const checkFullScreenStatus = () => {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    const handleFullScreenChange = () => {
      const newFullScreenStatus = checkFullScreenStatus();
      console.log('Full screen changed to:', newFullScreenStatus);
      
      setIsFullScreen(newFullScreenStatus);
      
      // Only enforce rules if exam is running
      if (examStarted) {
        if (!newFullScreenStatus) {
          // User exited full screen - pause exam
          setIsPaused(true);
          setShowFullScreenModal(true);
        } else {
          // User entered full screen - resume exam
          setIsPaused(false);
          setShowFullScreenModal(false);
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

  // Proctoring: Tab switch detection
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

    return () => {
      proctoringRef.current.isMonitoring = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStarted, tabSwitchCount]);

  // Timer with Pause/Resume functionality
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

  // SIMPLE Request full screen function
  const requestFullScreen = () => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen().catch(err => {
        console.log('Full screen request failed:', err);
      });
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
      });
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen().catch(err => {
        console.log('Full screen request failed:', err);
      });
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

  // Get exam organization type
  const getExamOrganization = () => {
    if (!examData) return 'linear';
    return examData.organization || 
           examData.exam?.question_organization || 
           'linear';
  };

  // Get all questions (for linear exams)
  const getQuestions = () => {
    if (!examData) return [];
    return examData.questions || 
           examData.exam?.questions || 
           examData.questionSet || 
           [];
  };

  // Get sections (for section-wise exams)
  const getSections = () => {
    if (!examData) return [];
    
    if (getExamOrganization() === 'section_wise') {
      return examData.sections || 
             examData.exam?.sections || 
             examData.section_config?.sections || 
             [];
    }
    
    return [];
  };

  // Get current section
  const getCurrentSection = () => {
    const sections = getSections();
    return sections[currentSectionIndex] || null;
  };

  // Get questions for current section
  const getCurrentSectionQuestions = () => {
    if (getExamOrganization() === 'linear') {
      return getQuestions();
    }
    
    const currentSection = getCurrentSection();
    return currentSection?.questions || [];
  };

  // Get current question
  const getCurrentQuestion = () => {
    const questions = getCurrentSectionQuestions();
    return questions[currentQuestionIndex] || null;
  };

  // Get total questions count
  const getTotalQuestionsCount = () => {
    if (getExamOrganization() === 'linear') {
      return getQuestions().length;
    }
    
    const sections = getSections();
    return sections.reduce((total, section) => total + (section.questions?.length || 0), 0);
  };

  // Get answered questions count
  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  // Calculate progress data for ProgressTab and SubmissionConfirmation
  const calculateProgressData = () => {
    if (!examData) return null;

    if (getExamOrganization() === 'section_wise') {
      const sections = getSections();
      return sections.map((section, index) => {
        const sectionQuestions = section.questions || [];
        const answered = sectionQuestions.filter(q => answers[q.id]).length;
        const visited = sectionQuestions.filter(q => 
          visitedQuestions.includes(q.id) && !answers[q.id]
        ).length;
        const unanswered = sectionQuestions.length - answered - visited;

        return {
          id: section.id,
          name: section.name,
          total: sectionQuestions.length,
          answered,
          visited,
          unanswered,
          progress: sectionQuestions.length > 0 ? (answered / sectionQuestions.length) * 100 : 0
        };
      });
    } else {
      // Linear exam progress
      const questions = getQuestions();
      const answered = Object.keys(answers).length;
      const visited = visitedQuestions.filter(qId => !answers[qId]).length;
      const unanswered = questions.length - answered - visited;

      return {
        total: questions.length,
        answered,
        visited,
        unanswered,
        progress: questions.length > 0 ? (answered / questions.length) * 100 : 0
      };
    }
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

  // Function to create or get attempt data
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

  // SIMPLE Start Exam function
  const startExam = async () => {
    if (!examData || getTotalQuestionsCount() === 0) {
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
      
      // Start the exam
      setExamStarted(true);
      
      // Request full screen after a short delay to let the UI update
      setTimeout(() => {
        requestFullScreen();
      }, 100);
      
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
    const questions = getCurrentSectionQuestions();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next section if available
      const sections = getSections();
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // Move to previous section if available
      if (currentSectionIndex > 0) {
        const sections = getSections();
        const prevSectionQuestions = sections[currentSectionIndex - 1]?.questions || [];
        setCurrentSectionIndex(prev => prev - 1);
        setCurrentQuestionIndex(prevSectionQuestions.length - 1);
      }
    }
  };

  // Navigate to specific section and question
  const navigateToQuestion = (sectionIndex, questionIndex) => {
    if (isPaused) return;
    
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
  };

  // Submit current section
  const handleSubmitSection = async () => {
    const currentSection = getCurrentSection();
    if (!currentSection) return;

    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      const examId = getExamId();

      const sectionAnswers = Object.entries(answers).filter(([questionId, answer]) => {
        const question = getCurrentSectionQuestions().find(q => q.id === parseInt(questionId));
        return question;
      });

      const response = await fetch(`${API_BASE}/api/student/exams/${examId}/sections/${currentSection.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attemptId: attemptData?.attemptId,
          sessionToken: attemptData?.sessionToken,
          answers: sectionAnswers.map(([questionId, answer]) => ({
            questionId: parseInt(questionId),
            answer: answer
          }))
        })
      });

      if (response.ok) {
        setSubmittedSections(prev => [...prev, currentSection.id]);
        alert(`Section "${currentSection.name}" submitted successfully!`);
        
        // Move to next section if available
        const sections = getSections();
        if (currentSectionIndex < sections.length - 1) {
          setCurrentSectionIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        }
      } else {
        throw new Error('Failed to submit section');
      }
    } catch (error) {
      console.error('Error submitting section:', error);
      alert('Error submitting section. Please try again.');
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

  const handleSubmitClick = () => {
    setShowSubmissionConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmissionConfirm(false);
    handleSubmit(false);
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
        sessionToken: attemptData.sessionToken,
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

  const isLastSection = () => {
    const sections = getSections();
    return currentSectionIndex === sections.length - 1;
  };

  const isLastQuestionInSection = () => {
    const questions = getCurrentSectionQuestions();
    return currentQuestionIndex === questions.length - 1;
  };

  const isSectionSubmitted = (sectionId) => {
    return submittedSections.includes(sectionId);
  };

  const getProgressPercentage = () => {
    const totalQuestions = getTotalQuestionsCount();
    const answeredQuestions = getAnsweredQuestionsCount();
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const questions = getCurrentSectionQuestions();
  const sections = getSections();
  const isSectionWise = getExamOrganization() === 'section_wise';
  const progressData = calculateProgressData();

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

  if (getTotalQuestionsCount() === 0) {
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
            <p><strong>Total Questions:</strong> {getTotalQuestionsCount()}</p>
            {isSectionWise && (
              <p><strong>Sections:</strong> {sections.length}</p>
            )}
            <p><strong>Organization:</strong> {isSectionWise ? 'Section-wise' : 'Linear'}</p>
            <p><strong>Full Screen:</strong> <span style={{color: 'red', fontWeight: 'bold'}}>MANDATORY</span></p>
            <p><strong>Proctoring:</strong> Enabled (Max {MAX_TAB_SWITCHES} tab switches allowed)</p>
          </div>

          {isSectionWise && (
            <div className="sections-preview">
              <h4>Exam Sections:</h4>
              <div className="sections-list">
                {sections.map((section, index) => (
                  <div key={section.id} className="section-preview">
                    <div className="section-preview-header">
                      <span className="section-number">Section {index + 1}</span>
                      <span className="questions-count">{section.questions?.length || 0} questions</span>
                    </div>
                    <h5>{section.name}</h5>
                    {section.description && (
                      <p className="section-description">{section.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="instructions-list">
            <h4>Important Instructions:</h4>
            <ul>
              <li>You have <strong>{validatedDuration} minutes</strong> to complete the exam</li>
              {isSectionWise && (
                <li><strong>Section Navigation:</strong> {examData.navigation_rules?.allow_back ? 'You can go back to previous sections' : 'You cannot go back to previous sections'}</li>
              )}
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

  const currentQuestion = getCurrentQuestion();
  const currentSection = getCurrentSection();

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
      {/* Progress Tab Component */}
      <ProgressTab
        examData={examData}
        answers={answers}
        currentSectionIndex={currentSectionIndex}
        currentQuestionIndex={currentQuestionIndex}
        isSectionWise={isSectionWise}
        visitedQuestions={visitedQuestions}
      />

      {/* Submission Confirmation Modal */}
      <SubmissionConfirmation
        isOpen={showSubmissionConfirm}
        onClose={() => setShowSubmissionConfirm(false)}
        onConfirm={handleConfirmSubmit}
        progressData={progressData}
        isSectionWise={isSectionWise}
      />

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
        <div className="exam-title-section">
          <h2>{getExamTitle()}</h2>
          {isSectionWise && currentSection && (
            <div className="current-section-info">
              <span className="section-badge">Section {currentSectionIndex + 1} of {sections.length}</span>
              <span className="section-name">{currentSection.name}</span>
            </div>
          )}
        </div>
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
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
        <div className="progress-text">
          {isSectionWise ? (
            <>
              Section {currentSectionIndex + 1} of {sections.length} • 
              Question {currentQuestionIndex + 1} of {questions.length} •
              {` ${getAnsweredQuestionsCount()}/${getTotalQuestionsCount()} answered`}
            </>
          ) : (
            <>
              Question {currentQuestionIndex + 1} of {questions.length}
              {` (${getAnsweredQuestionsCount()} answered)`}
            </>
          )}
          {isPaused && <span style={{color: 'orange', marginLeft: '10px'}}>⏸️ PAUSED</span>}
        </div>
      </div>

      {isSectionWise && (
        <div className="sections-navigation">
          <div className="sections-tabs">
            {sections.map((section, index) => (
              <button
                key={section.id}
                className={`section-tab ${index === currentSectionIndex ? 'active' : ''} ${
                  isSectionSubmitted(section.id) ? 'submitted' : ''
                }`}
                onClick={() => navigateToQuestion(index, 0)}
                disabled={isPaused || (!examData.navigation_rules?.allow_back && index < currentSectionIndex)}
              >
                <span className="section-tab-number">{index + 1}</span>
                <span className="section-tab-name">{section.name}</span>
                {isSectionSubmitted(section.id) && (
                  <span className="submitted-badge">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="question-container">
        <div className="question-header">
          <h3>
            {isSectionWise ? `Section ${currentSectionIndex + 1} - ` : ''}
            Question {currentQuestionIndex + 1}
          </h3>
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
          disabled={
            (currentQuestionIndex === 0 && currentSectionIndex === 0) || 
            isPaused ||
            (!examData.navigation_rules?.allow_back && currentSectionIndex > 0)
          }
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        <div className="question-counter">
          {isSectionWise ? (
            <>
              Section {currentSectionIndex + 1}/{sections.length} • 
              Q{currentQuestionIndex + 1}/{questions.length}
            </>
          ) : (
            <>
              {currentQuestionIndex + 1} / {questions.length}
            </>
          )}
          {isPaused && <span style={{color: 'orange'}}> (Paused)</span>}
        </div>

        {isSectionWise && isLastQuestionInSection() && !isLastSection() ? (
          <button 
            onClick={handleSubmitSection}
            disabled={isPaused}
            className="btn btn-warning"
          >
            Submit Section & Continue
          </button>
        ) : currentQuestionIndex === questions.length - 1 && (isLastSection() || !isSectionWise) ? (
          <button 
            onClick={handleSubmitClick}
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
        <h4>Questions{isSectionWise ? ` (Section ${currentSectionIndex + 1})` : ''}:</h4>
        <div className="question-dots">
          {questions.map((question, index) => (
            <button
              key={index}
              className={`dot ${index === currentQuestionIndex ? 'active' : ''} ${
                answers[question.id] ? 'answered' : visitedQuestions.includes(question.id) ? 'visited' : 'unanswered'
              }`}
              onClick={() => !isPaused && navigateToQuestion(currentSectionIndex, index)}
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