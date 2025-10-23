// ResultsView.js
import React, { useState, useEffect } from 'react';
import TeacherResultDetails from './TeacherResultDetails';
import './ResultsView.css';

const ResultsView = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchResults();
  }, [exam.id]);

  useEffect(() => {
    // Filter results based on search term
    let filtered = results;
    
    if (searchTerm) {
      filtered = results.filter(attempt => 
        attempt.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort results
    const sorted = sortResults(filtered, sortConfig.key, sortConfig.direction);
    setFilteredResults(sorted);
  }, [results, searchTerm, sortConfig]);

  const fetchResults = async () => {
    try {
      setError(null);
      setLoading(true);
      setRefreshing(true);

      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch results' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message || 'Network error: Unable to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/results/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exam.title.replace(/\s+/g, '_')}_results.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download results' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      alert(`Error downloading results: ${error.message}`);
    }
  };

  const handleViewDetails = (attempt) => {
    // Calculate rank and other details for the student
    const studentsWithRank = results
      .map(a => {
        const totalMarks = a.answers.reduce((sum, answer) => 
          sum + (answer.question ? answer.question.marks : 0), 0);
        const obtainedMarks = a.answers.reduce((sum, answer) => 
          sum + (answer.marks_obtained || 0), 0);
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
        return { ...a, obtainedMarks, totalMarks, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const studentRank = studentsWithRank.findIndex(a => a.id === attempt.id) + 1;
    
    const studentData = {
      name: attempt.student?.name || 'N/A',
      email: attempt.student?.email || 'N/A',
      rank: studentRank,
      attemptId: attempt.id,
      score: attempt.obtainedMarks || 0,
      percentage: (attempt.percentage || 0).toFixed(2),
      completionTime: attempt.end_time ? new Date(attempt.end_time).toLocaleString() : 'Not completed'
    };

    setSelectedStudent(studentData);
    setShowDetails(true);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortResults = (data, key, direction) => {
    return [...data].sort((a, b) => {
      // First, calculate the metrics for both items
      const totalMarksA = a.answers.reduce((sum, answer) => 
        sum + (answer.question ? answer.question.marks : 0), 0);
      const obtainedMarksA = a.answers.reduce((sum, answer) => 
        sum + (answer.marks_obtained || 0), 0);
      const percentageA = totalMarksA > 0 ? (obtainedMarksA / totalMarksA) * 100 : 0;

      const totalMarksB = b.answers.reduce((sum, answer) => 
        sum + (answer.question ? answer.question.marks : 0), 0);
      const obtainedMarksB = b.answers.reduce((sum, answer) => 
        sum + (answer.marks_obtained || 0), 0);
      const percentageB = totalMarksB > 0 ? (obtainedMarksB / totalMarksB) * 100 : 0;

      // Calculate ranks for both items
      const allStudents = [...data].map(student => {
        const totalMarks = student.answers.reduce((sum, answer) => 
          sum + (answer.question ? answer.question.marks : 0), 0);
        const obtainedMarks = student.answers.reduce((sum, answer) => 
          sum + (answer.marks_obtained || 0), 0);
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
        return { ...student, obtainedMarks, percentage };
      }).sort((x, y) => y.percentage - x.percentage);

      const rankA = allStudents.findIndex(student => student.id === a.id) + 1;
      const rankB = allStudents.findIndex(student => student.id === b.id) + 1;

      let aValue, bValue;

      switch (key) {
        case 'rank':
          aValue = rankA;
          bValue = rankB;
          break;
        case 'name':
          aValue = a.student?.name?.toLowerCase() || '';
          bValue = b.student?.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.student?.email?.toLowerCase() || '';
          bValue = b.student?.email?.toLowerCase() || '';
          break;
        case 'percentage':
          aValue = percentageA;
          bValue = percentageB;
          break;
        case 'completionTime':
          aValue = a.end_time ? new Date(a.end_time).getTime() : 0;
          bValue = b.end_time ? new Date(b.end_time).getTime() : 0;
          break;
        case 'score':
          aValue = obtainedMarksA;
          bValue = obtainedMarksB;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleRefresh = () => {
    fetchResults();
  };

  const getPercentageColor = (percent) => {
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(attempt => {
      const obtainedMarks = attempt.answers.reduce((sum, answer) =>
        sum + (answer.marks_obtained || 0), 0);
      return obtainedMarks;
    });

    const totalMarks = results[0]?.answers.reduce((sum, answer) =>
      sum + (answer.question ? answer.question.marks : 0), 0) || 0;

    return {
      totalStudents: results.length,
      averageScore: (scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      totalMarks,
      averagePercentage: totalMarks > 0 ?
        ((scores.reduce((a, b) => a + b, 0) / (results.length * totalMarks)) * 100).toFixed(2) : 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="results-container">
        <div className="results-header">
          <div className="header-content">
            <h1 className="results-title">Exam Results</h1>
            <p className="results-subtitle">{exam.title}</p>
          </div>
          <button onClick={onBack} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  // If showing student details, render the TeacherResultDetails component
  if (showDetails && selectedStudent) {
    return (
      <TeacherResultDetails
        student={selectedStudent}
        examDetails={{
          id: exam.id,
          totalMarks: stats?.totalMarks || 0,
          title: exam.title,
          type: exam.question_organization
        }}
        examType={exam.question_organization || 'linear'}
        onBack={() => setShowDetails(false)}
      />
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="header-content">
          <h1 className="results-title">Exam Results</h1>
          <p className="results-subtitle">{exam.title}</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>
          {results.length > 0 && (
            <button onClick={handleDownload} className="btn-download" disabled={!API_BASE}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download CSV
            </button>
          )}
        </div>
      </div>

      {!API_BASE && (
        <div className="alert alert-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Backend Not Configured</strong>
            <p>Cannot fetch results without backend URL</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchResults} className="retry-btn">Retry</button>
        </div>
      )}

      {!error && results.length === 0 ? (
        <div className="no-results">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2>No results available yet</h2>
          <p>Students need to complete the exam for results to appear here.</p>
        </div>
      ) : results.length > 0 && (
        <>
          {stats && (
            <div className="stats-section">
              <h2>Summary Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.totalStudents}</div>
                    <div className="stat-label-result">Total Students</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.averageScore}</div>
                    <div className="stat-label-result">Average Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.highestScore}</div>
                    <div className="stat-label-result">Highest Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.lowestScore}</div>
                    <div className="stat-label-result">Lowest Score</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.totalMarks}</div>
                    <div className="stat-label-result">Total Marks</div>
                  </div>
                </div>

                <div className="stat-card-result">
                  <div className="stat-icon-result">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="stat-content-result">
                    <div className="stat-value-result">{stats.averagePercentage}%</div>
                    <div className="stat-label-result">Avg Percentage</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="results-table-section">
            <div className="table-controls">
              <div className="search-control">
                <div className="search-input-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search" 
                      onClick={() => setSearchTerm('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="search-info">
                  Showing {filteredResults.length} of {results.length} students
                  {searchTerm && (
                    <span className="search-term"> for "{searchTerm}"</span>
                  )}
                </div>
              </div>
              
              <div className="controls-right">
                <button 
                  onClick={handleRefresh} 
                  className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
                  disabled={refreshing}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('rank')}
                      className="sortable-header"
                    >
                      Rank {getSortIcon('rank')}
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="sortable-header"
                    >
                      Student Name {getSortIcon('name')}
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      className="sortable-header"
                    >
                      Email {getSortIcon('email')}
                    </th>
                    <th 
                      onClick={() => handleSort('score')}
                      className="sortable-header"
                    >
                      Score {getSortIcon('score')}
                    </th>
                    <th>Total Marks</th>
                    <th 
                      onClick={() => handleSort('percentage')}
                      className="sortable-header"
                    >
                      Percentage {getSortIcon('percentage')}
                    </th>
                    <th 
                      onClick={() => handleSort('completionTime')}
                      className="sortable-header"
                    >
                      Completion Time {getSortIcon('completionTime')}
                    </th>
                    <th>View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .map((attempt, index) => {
                      const totalMarks = attempt.answers.reduce((sum, answer) =>
                        sum + (answer.question ? answer.question.marks : 0), 0);
                      const obtainedMarks = attempt.answers.reduce((sum, answer) =>
                        sum + (answer.marks_obtained || 0), 0);
                      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                      
                      // Calculate actual rank based on percentage
                      const allStudents = [...results].map(student => {
                        const totalMarks = student.answers.reduce((sum, answer) => 
                          sum + (answer.question ? answer.question.marks : 0), 0);
                        const obtainedMarks = student.answers.reduce((sum, answer) => 
                          sum + (answer.marks_obtained || 0), 0);
                        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
                        return { ...student, obtainedMarks, percentage };
                      }).sort((a, b) => b.percentage - a.percentage);

                      const rank = allStudents.findIndex(student => student.id === attempt.id) + 1;
                      
                      return { ...attempt, obtainedMarks, totalMarks, percentage, rank };
                    })
                    .map((attempt, index) => {
                      const completionTime = attempt.end_time ?
                        new Date(attempt.end_time).toLocaleString() : 'Not completed';

                      return (
                        <tr key={attempt.id} className="table-row" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td>
                            <div className="rank-badge">
                              {attempt.rank === 1 && '🥇'}
                              {attempt.rank === 2 && '🥈'}
                              {attempt.rank === 3 && '🥉'}
                              {attempt.rank > 3 && `#${attempt.rank}`}
                            </div>
                          </td>
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                {attempt.student?.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <span className="student-name">{attempt.student?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="email-cell">{attempt.student?.email || 'N/A'}</td>
                          <td className="score-cell">
                            <strong>{attempt.obtainedMarks}</strong>
                          </td>
                          <td className="total-cell">{attempt.totalMarks}</td>
                          <td>
                            <div className={`percentage-badge ${getPercentageColor(attempt.percentage)}`}>
                              {attempt.percentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="time-cell">{completionTime}</td>
                          <td>
                            <button 
                              className="btn-view-details"
                              onClick={() => handleViewDetails(attempt)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {filteredResults.length === 0 && searchTerm && (
              <div className="no-search-results">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <h3>No students found</h3>
                <p>No students match your search for "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search-btn"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsView;