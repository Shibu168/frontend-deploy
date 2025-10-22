import React, { useState, useEffect } from 'react';
import './QuestionForm.css';

const QuestionForm = ({ exam, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_text: '',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: 'A',
    marks: 1
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    if (!exam || !exam.id) {
      console.log('No exam ID available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const responseText = await response.text();

      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error('Server returned HTML instead of JSON. Check if the API endpoint exists.');
      }

      try {
        const questions = JSON.parse(responseText);
        setQuestions(questions);
      } catch (parseError) {
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
      }

    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message);

      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name.startsWith('option_')) {
      const optionKey = e.target.name.split('_')[1];
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [optionKey]: e.target.value
        }
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('question_text', formData.question_text);
      formDataToSend.append('options', JSON.stringify(formData.options));
      formDataToSend.append('correct_answer', formData.correct_answer);
      formDataToSend.append('marks', formData.marks);

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = editingQuestion
        ? `${API_BASE}/api/teacher/questions/${editingQuestion.id}`
        : `${API_BASE}/api/teacher/exams/${exam.id}/questions`;

      const method = editingQuestion ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert(editingQuestion ? 'Question updated!' : 'Question added!');
        setShowForm(false);
        setFormData({
          question_text: '',
          options: { A: '', B: '', C: '', D: '' },
          correct_answer: 'A',
          marks: 1
        });
        setImageFile(null);
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert(`Error saving question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text || '',
      options: question.options,
      correct_answer: question.correct_answer,
      marks: question.marks
    });
    setShowForm(true);
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        if (!API_BASE) {
          throw new Error('Backend URL not configured');
        }

        const response = await fetch(`${API_BASE}/api/teacher/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          alert('Question deleted successfully');
          fetchQuestions();
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert(`Error deleting question: ${error.message}`);
      }
    }
  };

  const handlePublish = async () => {
    try {
      if (!API_BASE) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert('Exam published successfully! Share this token with students: ' + result.token);
        onBack();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to publish exam' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error publishing exam:', error);
      alert(`Error publishing exam: ${error.message}`);
    }
  };

  return (
    <div className="question-form-container">
      <div className="question-header">
        <div className="header-content">
          <h1 className="question-title">Manage Questions</h1>
          <p className="question-subtitle">{exam.title}</p>
        </div>
        <div className="header-actions">
          <button onClick={onBack} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>
          {exam.status === 'draft' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-add-question">
              {showForm ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Question
                </>
              )}
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
            <p>Cannot fetch questions without backend URL</p>
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
          <button onClick={fetchQuestions} className="retry-btn">Retry</button>
        </div>
      )}

      {showForm && (
        <div className="question-form-card">
          <div className="form-card-header">
            <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
            <button onClick={() => setShowForm(false)} className="close-form-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="question-form">
            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
                Question Text (optional if image is provided)
              </label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter your question here"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                Question Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-file-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Options
              </label>
              <div className="options-grid">
                {['A', 'B', 'C', 'D'].map(option => (
                  <div key={option} className="option-input-group">
                    <span className="option-label">{option}</span>
                    <input
                      type="text"
                      name={`option_${option}`}
                      value={formData.options[option]}
                      onChange={handleChange}
                      className="form-input"
                      placeholder={`Option ${option}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  Correct Answer
                </label>
                <select
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Marks
                </label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading || !API_BASE}>
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="questions-section">
        <div className="questions-section-header">
          <h2>Questions ({questions.length})</h2>
          {exam.status === 'draft' && questions.length > 0 && (
            <button onClick={handlePublish} className="btn-publish" disabled={!API_BASE}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Publish Exam
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="no-questions">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            <h3>No questions added yet</h3>
            <p>Add your first question to get started!</p>
          </div>
        ) : (
          <div className="questions-list">
            {questions.map((question, index) => (
              <div key={question.id} className="question-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="question-card-header">
                  <div className="question-number">
                    <span>Q{index + 1}</span>
                  </div>
                  <div className="question-marks">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                  </div>
                </div>

                {question.question_text && (
                  <p className="question-text">{question.question_text}</p>
                )}

                {question.question_image && (
                  <div className="question-image">
                    <img src={question.question_image} alt="Question" />
                  </div>
                )}

                <div className="options-list">
                  {Object.entries(question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`option-item ${key === question.correct_answer ? 'correct' : ''}`}
                    >
                      <span className="option-key">{key}</span>
                      <span className="option-value">{value}</span>
                      {key === question.correct_answer && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {exam.status === 'draft' && (
                  <div className="question-actions">
                    <button onClick={() => handleEdit(question)} className="btn-edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(question.id)} className="btn-delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionForm;
