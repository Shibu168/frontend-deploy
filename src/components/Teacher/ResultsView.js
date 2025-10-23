import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import TeacherResultDetails from './TeacherResultDetails';
import './ResultsView.css';

const ResultsPage = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });
  const [refreshing, setRefreshing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    lowestScore: 0,
    highestScore: 0,
    averagePercentage: 0,
    totalMarks: 0
  });

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

  // Animate statistics
  useEffect(() => {
    if (results.length > 0) {
      const stats = calculateStats();
      if (stats) {
        const duration = 1500;
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;

          setAnimatedStats({
            totalStudents: Math.floor(stats.totalStudents * progress),
            averageScore: (stats.averageScore * progress).toFixed(2),
            lowestScore: Math.floor(stats.lowestScore * progress),
            highestScore: Math.floor(stats.highestScore * progress),
            averagePercentage: (stats.averagePercentage * progress).toFixed(2),
            totalMarks: stats.totalMarks
          });

          if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
      }
    }
  }, [results]);

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

  const handleRefresh = () => {
    fetchResults();
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

  const calculatePerformanceDistribution = () => {
    if (filteredResults.length === 0) return { excellent: 0, good: 0, average: 0, poor: 0 };

    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    filteredResults.forEach(attempt => {
      const totalMarks = attempt.answers.reduce((sum, answer) =>
        sum + (answer.question ? answer.question.marks : 0), 0);
      const obtainedMarks = attempt.answers.reduce((sum, answer) =>
        sum + (answer.marks_obtained || 0), 0);
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      if (percentage >= 80) distribution.excellent++;
      else if (percentage >= 60) distribution.good++;
      else if (percentage >= 40) distribution.average++;
      else distribution.poor++;
    });

    return distribution;
  };

  const getPercentageColor = (percent) => {
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
  };

  const performanceDistribution = calculatePerformanceDistribution();
  const totalStudents = filteredResults.length;

  if (loading) {
    return (
      <div className="results-page">
        <header className="results-header">
          <div className="header-left">
            <h1>Exam Results</h1>
            <span className="exam-name">{exam.title}</span>
          </div>
          <div className="header-right">
            <button className="btn-gradient" onClick={onBack}>
              <span>Back to Exams</span>
            </button>
          </div>
        </header>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (showDetails && selectedStudent) {
    return (
      <TeacherResultDetails
        student={selectedStudent}
        examDetails={{
          id: exam.id,
          totalMarks: animatedStats.totalMarks || 0,
          title: exam.title,
          type: exam.question_organization
        }}
        examType={exam.question_organization || 'linear'}
        onBack={() => setShowDetails(false)}
      />
    );
  }

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="header-left">
          <h1>Exam Results</h1>
          <span className="exam-name">{exam.title}</span>
        </div>
        <div className="header-right">
          <button className="btn-gradient" onClick={onBack}>
            <span>Back to Exams</span>
          </button>
          {results.length > 0 && (
            <button className="btn-gradient" onClick={handleDownload} disabled={!API_BASE}>
              <Download size={18} />
              <span>Download</span>
            </button>
          )}
        </div>
      </header>

      {!API_BASE && (
        <div className="alert alert-error">
          <strong>Backend Not Configured</strong>
          <p>Cannot fetch results without backend URL</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error</strong>
          <p>{error}</p>
          <button onClick={fetchResults} className="retry-btn">Retry</button>
        </div>
      )}

      {!error && results.length === 0 ? (
        <div className="no-results">
          <h2>No results available yet</h2>
          <p>Students need to complete the exam for results to appear here.</p>
        </div>
      ) : results.length > 0 && (
        <>
          <section className="summary-stats">
            <div className="stat-card stat-card-1">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.totalStudents}</div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>

            <div className="stat-card stat-card-2">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.totalMarks}</div>
                <div className="stat-label">Total Marks</div>
              </div>
            </div>

            <div className="stat-card stat-card-3">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.averageScore}</div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>

            <div className="stat-card stat-card-4">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.lowestScore}</div>
                <div className="stat-label">Lowest Score</div>
              </div>
            </div>

            <div className="stat-card stat-card-5">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.highestScore}</div>
                <div className="stat-label">Highest Score</div>
              </div>
            </div>

            <div className="stat-card stat-card-6">
              <div className="stat-icon">💯</div>
              <div className="stat-content">
                <div className="stat-value">{animatedStats.averagePercentage}%</div>
                <div className="stat-label">Average Percentage</div>
              </div>
            </div>
          </section>

          <section className="table-section">
            <div className="table-controls">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="control-actions">
                <select 
                  value={sortConfig.key} 
                  onChange={(e) => handleSort(e.target.value)} 
                  className="sort-dropdown"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="score">Sort by Score</option>
                  <option value="percentage">Sort by Percentage</option>
                  <option value="completionTime">Sort by Completion Time</option>
                </select>
                <button 
                  className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Total Marks</th>
                    <th>Percentage</th>
                    <th>Completion Time</th>
                    <th>Actions</th>
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
                          <td className="student-name">
                            <div className="student-info">
                              <div className="student-avatar">
                                {attempt.student?.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <span>{attempt.student?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="student-email">{attempt.student?.email || 'N/A'}</td>
                          <td className="score-cell">{attempt.obtainedMarks}</td>
                          <td>{attempt.totalMarks}</td>
                          <td>
                            <div className={`percentage-badge ${getPercentageColor(attempt.percentage)}`}>
                              {attempt.percentage.toFixed(2)}%
                            </div>
                          </td>
                          <td>{completionTime}</td>
                          <td>
                            <button 
                              className="view-details-btn"
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
          </section>

          <section className="charts-section">
            <h2>Performance Analytics</h2>
            <div className="charts-container one-chart">
              <div className="chart-card">
                <h3>Score Distribution</h3>
                <div className="pie-chart">
                  <div className="chart-placeholder">
                    <svg viewBox="0 0 200 200" className="pie-svg">
                      {totalStudents > 0 && (
                        <>
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="none" 
                            stroke="url(#gradient1)" 
                            strokeWidth="40" 
                            strokeDasharray={`${(performanceDistribution.excellent / totalStudents) * 251.2} 251.2`} 
                            transform="rotate(-90 100 100)" 
                          />
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="none" 
                            stroke="url(#gradient2)" 
                            strokeWidth="40" 
                            strokeDasharray={`${(performanceDistribution.good / totalStudents) * 251.2} 251.2`} 
                            strokeDashoffset={`-${(performanceDistribution.excellent / totalStudents) * 251.2}`} 
                            transform="rotate(-90 100 100)" 
                          />
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="none" 
                            stroke="url(#gradient3)" 
                            strokeWidth="40" 
                            strokeDasharray={`${(performanceDistribution.average / totalStudents) * 251.2} 251.2`} 
                            strokeDashoffset={`-${((performanceDistribution.excellent + performanceDistribution.good) / totalStudents) * 251.2}`} 
                            transform="rotate(-90 100 100)" 
                          />
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="none" 
                            stroke="url(#gradient4)" 
                            strokeWidth="40" 
                            strokeDasharray={`${(performanceDistribution.poor / totalStudents) * 251.2} 251.2`} 
                            strokeDashoffset={`-${((performanceDistribution.excellent + performanceDistribution.good + performanceDistribution.average) / totalStudents) * 251.2}`} 
                            transform="rotate(-90 100 100)" 
                          />
                        </>
                      )}
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#667eea" />
                          <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f093fb" />
                          <stop offset="100%" stopColor="#f5576c" />
                        </linearGradient>
                        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4facfe" />
                          <stop offset="100%" stopColor="#00f2fe" />
                        </linearGradient>
                        <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#43e97b" />
                          <stop offset="100%" stopColor="#38f9d7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-color" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></span>
                        <span>Excellent (80-100%) - {performanceDistribution.excellent}</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}></span>
                        <span>Good (60-79%) - {performanceDistribution.good}</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}></span>
                        <span>Average (40-59%) - {performanceDistribution.average}</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}></span>
                        <span>Poor (&lt;40%) - {performanceDistribution.poor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ResultsView;