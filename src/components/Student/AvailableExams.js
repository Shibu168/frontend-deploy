import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Calendar, Clock, Globe, Share2, ArrowRight, AlertCircle } from 'lucide-react';
import './AvailableExams.css';

const AvailableExams = ({ onExamSelect }) => {
  const [exams, setExams] = useState({ public: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const API_BASE = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/student/exams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        setError('Failed to load exams');
      }
    } catch (error) {
      setError('Error loading exams');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (exam) => {
    if (exam.visibility === 'public' || exam.visibility === 'shared') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/student/exams/${exam.id}/start`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const examData = await response.json();
          onExamSelect(examData.exam);
        } else {
          const errorData = await response.json();
          alert('Failed to start exam: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error starting exam:', error);
        alert('Error starting exam. Please try again.');
      }
    } else {
      alert('This is a private exam. Please use the shareable link provided by your teacher.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return {
      date: formatDate(end),
      time: formatTime(end)
    };
  };

  // Process and filter exams based on search and sort
  const processedExams = useMemo(() => {
    const currentExams = activeTab === 'public' ? exams.public : exams.shared;
    
    let filtered = currentExams.filter(exam =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort exams
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'duration':
          return a.duration_minutes - b.duration_minutes;
        case 'date':
        default:
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }
    });

    return filtered;
  }, [exams, activeTab, searchQuery, sortBy]);

  const publicExamsCount = exams.public.length;
  const sharedExamsCount = exams.shared.length;
  const totalExams = publicExamsCount + sharedExamsCount;

  // Advanced loading component
  if (loading) {
    return (
      <div className="available-exams-container">
        <div className="exams-header">
          <div className="header-content">
            <h1 className="page-title">Available Exams</h1>
            <p className="page-subtitle">Loading your exams...</p>
          </div>
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-content">
            <h3>Preparing Your Exams</h3>
            <p>We're gathering all available exams for you. This will just take a moment.</p>
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="available-exams-container">
        <div className="error-container">
          <div className="error-icon">
            <AlertCircle size={48} />
          </div>
          <h3>Unable to Load Exams</h3>
          <p>{error}</p>
          <button onClick={fetchAvailableExams} className="retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="available-exams-container">
      <div className="exams-header">
        <div className="header-content">
          <h1 className="page-title">Available Exams</h1>
          <p className="page-subtitle">Choose an exam to get started</p>
        </div>

        <div className="exam-stats">
          <div className="stat-card stat-public">
            <Globe className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{publicExamsCount}</span>
              <span className="stat-label">Public Exams</span>
            </div>
          </div>
          <div className="stat-card stat-shared">
            <Share2 className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{sharedExamsCount}</span>
              <span className="stat-label">Shared with Me</span>
            </div>
          </div>
        </div>
      </div>

      {totalExams === 0 ? (
        <div className="no-exams">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Exams Available</h3>
            <p>There are no exams available at the moment.</p>
            <p className="hint">If you have a private exam link, ask your teacher to share it with you.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="exams-tabs">
            <button
              className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              <Globe className="tab-icon" />
              Public Exams
              <span className="tab-badge">{publicExamsCount}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveTab('shared')}
            >
              <Share2 className="tab-icon" />
              Shared with Me
              <span className="tab-badge">{sharedExamsCount}</span>
            </button>
          </div>

          <div className="exams-controls">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search exams by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="controls-actions">
              <div className="sort-container">
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              <button className="refresh-button" onClick={fetchAvailableExams}>
                <RefreshCw className="refresh-icon" />
              </button>
            </div>
          </div>

          <div className="exams-grid">
            {processedExams.map((exam, index) => {
              const endTime = calculateEndTime(exam.start_time, exam.duration_minutes);
              
              return (
                <div
                  key={exam.id}
                  className="exam-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="exam-card-header">
                    <h3 className="exam-title">{exam.title}</h3>
                    {exam.visibility === 'shared' && exam.creator && (
                      <div className="shared-badge">
                        <Share2 size={14} />
                        <span>by {exam.creator.name || 'Teacher'}</span>
                      </div>
                    )}
                    {exam.visibility === 'public' && (
                      <div className="visibility-badge">
                        <Globe size={14} />
                        <span>Public</span>
                      </div>
                    )}
                  </div>

                  <p className="exam-description">{exam.description}</p>

                  <div className="exam-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <Clock className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Duration</span>
                          <span className="detail-value">{exam.duration_minutes} minutes</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <Calendar className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Start</span>
                          <span className="detail-value">
                            {formatDate(exam.start_time)} at {formatTime(exam.start_time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <Calendar className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">End</span>
                          <span className="detail-value">
                            {endTime.date} at {endTime.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExamSelect(exam)}
                    className="start-exam-button"
                  >
                    <span>Start Now</span>
                    <ArrowRight className="button-icon" />
                  </button>
                </div>
              );
            })}
          </div>

          {processedExams.length === 0 && (
            <div className="no-exams">
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Exams Found</h3>
                <p>No exams found matching your search criteria.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="clear-search-button"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableExams;