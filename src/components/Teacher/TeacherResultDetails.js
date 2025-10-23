import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import './ViewDetailsPage.css';

const TeacherResultDetails = ({ student, examDetails, onBack, examType }) => {
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [expandedSections, setExpandedSections] = useState({});
  const [animatedStats, setAnimatedStats] = useState({
    rank: 0,
    percentage: 0,
  });

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchStudentAnswers();
  }, [student.attemptId]);

  useEffect(() => {
    if (student) {
      const duration = 1500;
      const steps = 60;
      const interval = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;

        setAnimatedStats({
          rank: Math.floor(student.rank * progress),
          percentage: (student.percentage * progress).toFixed(2),
        });

        if (step >= steps) clearInterval(timer);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [student]);

  const fetchStudentAnswers = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE}/api/teacher/exams/${examDetails.id}/attempts/${student.attemptId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudentAnswers(data.answers || []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch student details' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching student answers:', error);
      setError(error.message || 'Network error: Unable to fetch student details');
      setStudentAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance statistics
  const calculatePerformance = (questions) => {
    const total = questions.length;
    const correct = questions.filter(q => q.marks_obtained > 0).length;
    const incorrect = questions.filter(q => q.answer && q.marks_obtained === 0).length;
    const unattempted = questions.filter(q => !q.answer).length;
    const marksObtained = questions.reduce((sum, q) => sum + (q.marks_obtained || 0), 0);
    const totalMarks = questions.reduce((sum, q) => sum + (q.question?.marks || 0), 0);

    return {
      total,
      correct,
      incorrect,
      unattempted,
      marksObtained,
      totalMarks,
      percentage: totalMarks > 0 ? ((marksObtained / totalMarks) * 100).toFixed(2) : 0
    };
  };

  // Chart data for performance
  const getChartData = (performance) => {
    return [
      { name: 'Correct', value: performance.correct, color: '#43e97b' },
      { name: 'Incorrect', value: performance.incorrect, color: '#fa709a' },
      { name: 'Unattempted', value: performance.unattempted, color: '#6b7280' }
    ];
  };

  // Get answer status for color coding
  const getAnswerStatus = (question) => {
    if (!question.answer) return 'unattempted';
    return question.marks_obtained > 0 ? 'correct' : 'incorrect';
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Render linear exam view
  const renderLinearExam = () => {
    const performance = calculatePerformance(studentAnswers);
    const chartData = getChartData(performance);

    return (
      <div className="questions-section">
        <h2>Question-wise Performance</h2>
        <div className="questions-table-wrapper">
          <table className="questions-table">
            <thead>
              <tr>
                <th>Q.No</th>
                <th>Question</th>
                <th>Correct Option</th>
                <th>Attempted Option</th>
                <th>Marks</th>
                <th>Marks Obtained</th>
              </tr>
            </thead>
            <tbody>
              {studentAnswers.map((answer, index) => (
                <tr key={answer.id} className={`${getAnswerStatus(answer)}-row`}>
                  <td>
                    <div className="question-number">Q{index + 1}</div>
                  </td>
                  <td className="question-text">
                    {answer.question?.question_text || 'Question not available'}
                  </td>
                  <td>
                    <div className="option-badge correct">
                      {answer.question?.correct_answer || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className={`option-badge ${getAnswerStatus(answer)}`}>
                      {answer.answer || 'Not Attempted'}
                    </div>
                  </td>
                  <td className="marks-cell">
                    {answer.question?.marks || 0}
                  </td>
                  <td>
                    <div className={`marks-badge ${answer.marks_obtained > 0 ? 'full-marks' : 'zero-marks'}`}>
                      {answer.marks_obtained || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render section-wise exam view
  const renderSectionWiseExam = () => {
    // Group answers by section
    const sections = {};
    studentAnswers.forEach(answer => {
      const sectionName = answer.question?.section_name || answer.question?.section_id || 'General Questions';
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push(answer);
    });

    const overallPerformance = calculatePerformance(studentAnswers);

    return (
      <div className="questions-section">
        <h2>Question-wise Performance</h2>
        <div className="sections-container">
          {Object.entries(sections).map(([sectionName, sectionAnswers], index) => {
            const isExpanded = expandedSections[sectionName];
            const sectionPerformance = calculatePerformance(sectionAnswers);
            const sectionPercentage = sectionPerformance.totalMarks > 0 ? 
              ((sectionPerformance.marksObtained / sectionPerformance.totalMarks) * 100).toFixed(2) : 0;

            return (
              <div key={sectionName} className="section-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="section-header" onClick={() => toggleSection(sectionName)}>
                  <div className="section-title">
                    <h3>{sectionName}</h3>
                    <span className="section-stats">
                      {sectionPerformance.marksObtained}/{sectionPerformance.totalMarks} marks ({sectionPercentage}%)
                    </span>
                  </div>
                  <button className="expand-btn">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="section-content">
                    <table className="questions-table">
                      <thead>
                        <tr>
                          <th>Q.No</th>
                          <th>Question</th>
                          <th>Correct Option</th>
                          <th>Attempted Option</th>
                          <th>Marks</th>
                          <th>Marks Obtained</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionAnswers.map((answer, index) => (
                          <tr key={answer.id} className={`${getAnswerStatus(answer)}-row`}>
                            <td>
                              <div className="question-number">Q{index + 1}</div>
                            </td>
                            <td className="question-text">
                              {answer.question?.question_text || 'Question not available'}
                            </td>
                            <td>
                              <div className="option-badge correct">
                                {answer.question?.correct_answer || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className={`option-badge ${getAnswerStatus(answer)}`}>
                                {answer.answer || 'Not Attempted'}
                              </div>
                            </td>
                            <td className="marks-cell">
                              {answer.question?.marks || 0}
                            </td>
                            <td>
                              <div className={`marks-badge ${answer.marks_obtained > 0 ? 'full-marks' : 'zero-marks'}`}>
                                {answer.marks_obtained || 0}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render performance charts
  const renderPerformanceCharts = () => {
    const overallPerformance = calculatePerformance(studentAnswers);
    const overallChartData = getChartData(overallPerformance);

    // For section-wise exams, calculate section performance
    let sectionPerformanceData = [];
    if (examType === 'section-wise') {
      const sections = {};
      studentAnswers.forEach(answer => {
        const sectionName = answer.question?.section_name || answer.question?.section_id || 'General Questions';
        if (!sections[sectionName]) {
          sections[sectionName] = [];
        }
        sections[sectionName].push(answer);
      });

      sectionPerformanceData = Object.entries(sections).map(([sectionName, sectionAnswers]) => {
        const performance = calculatePerformance(sectionAnswers);
        const percentage = performance.totalMarks > 0 ? 
          ((performance.marksObtained / performance.totalMarks) * 100).toFixed(2) : 0;
        
        return {
          name: sectionName,
          percentage: parseFloat(percentage),
          marksObtained: performance.marksObtained,
          totalMarks: performance.totalMarks
        };
      });
    }

    return (
      <section className="performance-charts">
        <h2>Performance Overview</h2>
        <div className={`charts-grid ${examType === 'linear' ? 'single-chart' : 'dual-chart'}`}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Overall Performance</h3>
              <div className="chart-toggle">
                <button 
                  className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
                  onClick={() => setChartType('pie')}
                >
                  Pie
                </button>
                <button 
                  className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  Bar
                </button>
              </div>
            </div>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={overallChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={overallChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8">
                      {overallChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {examType === 'section-wise' && (
            <div className="chart-card">
              <h3>Section-wise Breakdown</h3>
              <div className="section-bar-chart">
                {sectionPerformanceData.map((section, index) => (
                  <div key={section.name} className="section-bar-item">
                    <div className="section-bar-info">
                      <span className="section-bar-name">{section.name}</span>
                      <span className="section-bar-value">{section.percentage}%</span>
                    </div>
                    <div className="section-bar-track">
                      <div 
                        className={`section-bar-fill section-bar-${(index % 3) + 1}`}
                        style={{ width: `${section.percentage}%` }}
                      ></div>
                    </div>
                    <div className="section-bar-details">
                      {section.marksObtained}/{section.totalMarks} marks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Render performance summary cards
  const renderPerformanceSummary = () => {
    const performance = calculatePerformance(studentAnswers);

    return (
      <div className="performance-summary-cards">
        <div className="summary-card total">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{performance.total}</div>
            <div className="card-label">Total Questions</div>
          </div>
        </div>

        <div className="summary-card correct">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{performance.correct}</div>
            <div className="card-label">Correct</div>
          </div>
        </div>

        <div className="summary-card incorrect">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <div className="card-value">{performance.incorrect}</div>
            <div className="card-label">Incorrect</div>
          </div>
        </div>

        <div className="summary-card unattempted">
          <div className="card-icon">⏸️</div>
          <div className="card-content">
            <div className="card-value">{performance.unattempted}</div>
            <div className="card-label">Unattempted</div>
          </div>
        </div>

        <div className="summary-card marks">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="card-value">{performance.marksObtained}/{performance.totalMarks}</div>
            <div className="card-label">Marks Obtained</div>
          </div>
        </div>

        <div className="summary-card percentage">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{performance.percentage}%</div>
            <div className="card-label">Accuracy</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="view-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-details-page">
      {/* Header Section */}
      <header className="details-header">
        <div className="student-summary-card">
          <div className="summary-left">
            <div className="student-avatar">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="student-info">
              <h1>{student.name}</h1>
              <p className="student-email">{student.email}</p>
            </div>
          </div>
          <div className="summary-stats-row">
            <div className="summary-stat">
              <div className="summary-stat-icon">🏆</div>
              <div className="summary-stat-content">
                <div className="summary-stat-value">{animatedStats.rank}</div>
                <div className="summary-stat-label">Rank</div>
              </div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-icon">📊</div>
              <div className="summary-stat-content">
                <div className="summary-stat-value">{student.score}</div>
                <div className="summary-stat-label">Score</div>
              </div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-icon">💯</div>
              <div className="summary-stat-content">
                <div className="summary-stat-value">{animatedStats.percentage}%</div>
                <div className="summary-stat-label">Percentage</div>
              </div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-icon">⏱️</div>
              <div className="summary-stat-content">
                <div className="summary-stat-value">{student.completionTime}</div>
                <div className="summary-stat-label">Time</div>
              </div>
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Results</span>
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Error Loading Details</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchStudentAnswers} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Performance Summary Cards */}
      {!error && studentAnswers.length > 0 && renderPerformanceSummary()}

      {/* Main Content */}
      {!error && studentAnswers.length > 0 && (
        <div className="details-content">
          {examType === 'linear' ? renderLinearExam() : renderSectionWiseExam()}
          {renderPerformanceCharts()}
        </div>
      )}

      {!error && studentAnswers.length === 0 && (
        <div className="no-data">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2>No answer data available</h2>
          <p>Student answer details could not be loaded.</p>
          <button onClick={fetchStudentAnswers} className="retry-btn">Retry</button>
        </div>
      )}
    </div>
  );
};

export default TeacherResultDetails;