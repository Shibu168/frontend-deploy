// TeacherResultDetails.js
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TeacherResultDetails.css';

const TeacherResultDetails = ({ student, examDetails, onBack, examType }) => {
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchStudentAnswers();
  }, [student.attemptId]);

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
      { name: 'Correct', value: performance.correct, color: '#10b981' },
      { name: 'Incorrect', value: performance.incorrect, color: '#ef4444' },
      { name: 'Unattempted', value: performance.unattempted, color: '#6b7280' }
    ];
  };

  // Get answer status for color coding
  const getAnswerStatus = (question) => {
    if (!question.answer) return 'unattempted';
    return question.marks_obtained > 0 ? 'correct' : 'incorrect';
  };

  // Render linear exam view
  const renderLinearExam = () => {
    const performance = calculatePerformance(studentAnswers);
    const chartData = getChartData(performance);

    return (
      <div className="linear-exam-view">
        {/* Questions Table */}
        <div className="questions-table-section">
          <h3>Question-wise Performance</h3>
          <div className="table-container">
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
                  <tr key={answer.id} className={`answer-row ${getAnswerStatus(answer)}`}>
                    <td className="question-number">{index + 1}</td>
                    <td className="question-text">{answer.question?.question_text}</td>
                    <td className="correct-option">{answer.question?.correct_answer}</td>
                    <td className="attempted-option">
                      {answer.answer || 'Not Attempted'}
                    </td>
                    <td className="total-marks">{answer.question?.marks}</td>
                    <td className="obtained-marks">{answer.marks_obtained || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="performance-summary">
          <div className="summary-cards">
            <div className="summary-card total">
              <div className="card-value">{performance.total}</div>
              <div className="card-label">Total Questions</div>
            </div>
            <div className="summary-card attempted">
              <div className="card-value">{performance.correct + performance.incorrect}</div>
              <div className="card-label">Attempted</div>
            </div>
            <div className="summary-card correct">
              <div className="card-value">{performance.correct}</div>
              <div className="card-label">Correct</div>
            </div>
            <div className="summary-card incorrect">
              <div className="card-value">{performance.incorrect}</div>
              <div className="card-label">Incorrect</div>
            </div>
            <div className="summary-card unattempted">
              <div className="card-value">{performance.unattempted}</div>
              <div className="card-label">Unattempted</div>
            </div>
            <div className="summary-card marks">
              <div className="card-value">{performance.marksObtained}/{performance.totalMarks}</div>
              <div className="card-label">Marks Obtained</div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>Performance Overview</h3>
            <div className="chart-toggle">
              <button 
                className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                Pie Chart
              </button>
              <button 
                className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                Bar Chart
              </button>
            </div>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render section-wise exam view
  const renderSectionWiseExam = () => {
    // Group answers by section
    const sections = {};
    studentAnswers.forEach(answer => {
      const sectionId = answer.question?.section_id || 'default';
      if (!sections[sectionId]) {
        sections[sectionId] = [];
      }
      sections[sectionId].push(answer);
    });

    const overallPerformance = calculatePerformance(studentAnswers);
    const overallChartData = getChartData(overallPerformance);

    return (
      <div className="section-wise-exam-view">
        {Object.entries(sections).map(([sectionId, sectionAnswers]) => {
          const sectionPerformance = calculatePerformance(sectionAnswers);
          const sectionChartData = getChartData(sectionPerformance);

          return (
            <div key={sectionId} className="section-container">
              <h3 className="section-title">
                {sectionId === 'default' ? 'General Questions' : `Section: ${sectionId}`}
              </h3>
              
              {/* Section Questions Table */}
              <div className="questions-table-section">
                <div className="table-container">
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
                        <tr key={answer.id} className={`answer-row ${getAnswerStatus(answer)}`}>
                          <td className="question-number">{index + 1}</td>
                          <td className="question-text">{answer.question?.question_text}</td>
                          <td className="correct-option">{answer.question?.correct_answer}</td>
                          <td className="attempted-option">
                            {answer.answer || 'Not Attempted'}
                          </td>
                          <td className="total-marks">{answer.question?.marks}</td>
                          <td className="obtained-marks">{answer.marks_obtained || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section Performance Summary */}
              <div className="performance-summary">
                <div className="summary-cards">
                  <div className="summary-card total">
                    <div className="card-value">{sectionPerformance.total}</div>
                    <div className="card-label">Total Questions</div>
                  </div>
                  <div className="summary-card correct">
                    <div className="card-value">{sectionPerformance.correct}</div>
                    <div className="card-label">Correct</div>
                  </div>
                  <div className="summary-card incorrect">
                    <div className="card-value">{sectionPerformance.incorrect}</div>
                    <div className="card-label">Incorrect</div>
                  </div>
                  <div className="summary-card unattempted">
                    <div className="card-value">{sectionPerformance.unattempted}</div>
                    <div className="card-label">Unattempted</div>
                  </div>
                  <div className="summary-card marks">
                    <div className="card-value">
                      {sectionPerformance.marksObtained}/{sectionPerformance.totalMarks}
                    </div>
                    <div className="card-label">Marks Obtained</div>
                  </div>
                </div>
              </div>

              {/* Section Chart */}
              <div className="chart-section">
                <div className="chart-header">
                  <h4>Section Performance</h4>
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
                  <ResponsiveContainer width="100%" height={250}>
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={sectionChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sectionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    ) : (
                      <BarChart data={sectionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8">
                          {sectionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overall Summary */}
        <div className="overall-summary">
          <h3>Overall Exam Performance</h3>
          <div className="performance-summary">
            <div className="summary-cards">
              <div className="summary-card total">
                <div className="card-value">{overallPerformance.total}</div>
                <div className="card-label">Total Questions</div>
              </div>
              <div className="summary-card attempted">
                <div className="card-value">{overallPerformance.correct + overallPerformance.incorrect}</div>
                <div className="card-label">Attempted</div>
              </div>
              <div className="summary-card correct">
                <div className="card-value">{overallPerformance.correct}</div>
                <div className="card-label">Correct</div>
              </div>
              <div className="summary-card incorrect">
                <div className="card-value">{overallPerformance.incorrect}</div>
                <div className="card-label">Incorrect</div>
              </div>
              <div className="summary-card unattempted">
                <div className="card-value">{overallPerformance.unattempted}</div>
                <div className="card-label">Unattempted</div>
              </div>
              <div className="summary-card marks">
                <div className="card-value">
                  {overallPerformance.marksObtained}/{overallPerformance.totalMarks}
                </div>
                <div className="card-label">Total Marks</div>
              </div>
            </div>
          </div>

          {/* Overall Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h4>Overall Performance</h4>
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
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="teacher-result-details">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-result-details">
      {/* Header Section */}
      <div className="details-header">
        <button onClick={onBack} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Results
        </button>
        
        <div className="student-summary">
          <h1>Student Performance Details</h1>
          <div className="summary-cards-grid">
            <div className="info-card rank">
              <div className="card-icon">🏆</div>
              <div className="card-content">
                <div className="card-value">#{student.rank}</div>
                <div className="card-label">Rank</div>
              </div>
            </div>
            
            <div className="info-card student">
              <div className="card-icon">👤</div>
              <div className="card-content">
                <div className="card-value">{student.name}</div>
                <div className="card-label">Student Name</div>
              </div>
            </div>
            
            <div className="info-card email">
              <div className="card-icon">📧</div>
              <div className="card-content">
                <div className="card-value">{student.email}</div>
                <div className="card-label">Email</div>
              </div>
            </div>
            
            <div className="info-card score">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-value">{student.score}/{examDetails.totalMarks}</div>
                <div className="card-label">Score</div>
              </div>
            </div>
            
            <div className="info-card percentage">
              <div className="card-icon">%</div>
              <div className="card-content">
                <div className="card-value">{student.percentage}%</div>
                <div className="card-label">Percentage</div>
              </div>
            </div>
            
            <div className="info-card time">
              <div className="card-icon">⏱️</div>
              <div className="card-content">
                <div className="card-value">{student.completionTime}</div>
                <div className="card-label">Completion Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Main Content */}
      {!error && studentAnswers.length > 0 && (
        <div className="details-content">
          {examType === 'linear' ? renderLinearExam() : renderSectionWiseExam()}
        </div>
      )}

      {!error && studentAnswers.length === 0 && (
        <div className="no-data">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2>No answer data available</h2>
          <p>Student answer details could not be loaded.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherResultDetails;