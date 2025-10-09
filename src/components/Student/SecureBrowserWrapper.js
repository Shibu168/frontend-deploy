// SecureBrowserWrapper.js
import React, { useState, useEffect, useRef } from 'react';
import './Secure.css';

const SecureBrowserWrapper = ({ children, examData }) => {
  const [securityStatus, setSecurityStatus] = useState({
    fullScreen: false,
    monitoringActive: true,
    violations: 0,
    lastViolation: null
  });

  const violationCountRef = useRef(0);
  const MAX_VIOLATIONS = 3;

  // Enhanced full-screen enforcement
  const enforceFullScreen = async () => {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      setSecurityStatus(prev => ({ ...prev, fullScreen: true }));
    } catch (error) {
      console.error('Full screen failed:', error);
      logSecurityEvent('full_screen_failure', { error: error.message });
    }
  };

  // Comprehensive keyboard shortcut blocking
  const disableKeyboardShortcuts = (e) => {
    const blockedCombinations = [
      // Ctrl combinations
      e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || 
                   e.key === 'x' || e.key === 'X' || e.key === 'z' || e.key === 'Z' ||
                   e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P'),
      // Alt combinations
      e.altKey && (e.key === 'Tab' || e.key === 'F4'),
      // Function keys
      e.key.startsWith('F') && e.key.length > 1,
      // Special keys
      e.key === 'PrintScreen' || e.key === 'Escape',
      // Windows/Command key
      e.key === 'Meta' || e.key === 'OS'
    ];

    if (blockedCombinations.some(condition => condition)) {
      e.preventDefault();
      e.stopPropagation();
      handleSecurityViolation('keyboard_shortcut', { key: e.key, ctrl: e.ctrlKey, alt: e.altKey });
    }
  };

  // Developer tools detection
  const detectDevTools = () => {
    const widthThreshold = 160;
    const heightThreshold = 160;
    
    setInterval(() => {
      if (window.outerWidth - window.innerWidth > widthThreshold || 
          window.outerHeight - window.innerHeight > heightThreshold) {
        handleSecurityViolation('dev_tools_detected');
      }
    }, 1000);
  };

  // Right-click and context menu prevention
  const preventContextMenu = (e) => {
    e.preventDefault();
    handleSecurityViolation('right_click_attempt');
  };

  // Screen recording/screenshot prevention attempts
  const preventScreenCapture = () => {
    // CSS-based prevention
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // Disable drag and drop
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  };

  const handleSecurityViolation = (type, details = {}) => {
    violationCountRef.current++;
    
    const violation = {
      type,
      timestamp: new Date().toISOString(),
      details,
      violationCount: violationCountRef.current
    };
    
    logSecurityEvent('security_violation', violation);
    setSecurityStatus(prev => ({
      ...prev,
      violations: violationCountRef.current,
      lastViolation: violation
    }));

    // Show warning or auto-submit based on violation count
    if (violationCountRef.current >= MAX_VIOLATIONS) {
      handleCriticalViolation();
    } else {
      showViolationWarning(violationCountRef.current);
    }
  };

  const logSecurityEvent = (eventType, data) => {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      examId: examData?.id,
      userId: localStorage.getItem('userId'),
      ...data
    };
    
    // Send to backend
    fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(error => console.error('Logging failed:', error));
    
    // Also store locally
    const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    existingLogs.push(event);
    localStorage.setItem('securityLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 events
  };

  const showViolationWarning = (count) => {
    const warnings = [
      "Warning: Security violation detected. This is your first warning.",
      "Second warning: Further violations may result in exam termination.",
      "Final warning: Next violation will auto-submit your exam."
    ];
    
    alert(warnings[count - 1]);
  };

  const handleCriticalViolation = () => {
    logSecurityEvent('exam_terminated', { reason: 'excessive_violations' });
    alert('Exam terminated due to multiple security violations.');
    window.dispatchEvent(new CustomEvent('exam-violation-termination'));
  };

  useEffect(() => {
    if (!examData) return;

    // Initialize security measures
    enforceFullScreen();
    preventScreenCapture();
    detectDevTools();

    // Event listeners
    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    // Visibility change detection
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Beforeunload prevention
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Log exam start
    logSecurityEvent('exam_started', { examData });

    return () => {
      document.removeEventListener('keydown', disableKeyboardShortcuts);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examData]);

  const handleFullScreenChange = () => {
    const isFullScreen = !!document.fullscreenElement;
    setSecurityStatus(prev => ({ ...prev, fullScreen: isFullScreen }));
    
    if (!isFullScreen) {
      handleSecurityViolation('full_screen_exit');
      setTimeout(enforceFullScreen, 1000);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      handleSecurityViolation('tab_switch', { hidden: document.hidden });
    }
  };

  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? This may terminate your exam.';
    return e.returnValue;
  };

  return (
    <div className="secure-browser-wrapper">
      <div className="security-status-bar">
        <div className={`status-indicator ${securityStatus.fullScreen ? 'secure' : 'warning'}`}>
          {securityStatus.fullScreen ? '🔒 Secure Mode Active' : '⚠️ Security Warning'}
        </div>
        <div className="violation-count">
          Violations: {securityStatus.violations}/{MAX_VIOLATIONS}
        </div>
      </div>
      
      {children}
      
      {securityStatus.lastViolation && (
        <div className="violation-warning">
          Last violation: {securityStatus.lastViolation.type}
        </div>
      )}
    </div>
  );
};

export default SecureBrowserWrapper;