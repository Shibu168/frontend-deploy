import React, { useState, useEffect } from 'react';

const QuestionForm = ({ exam, onBack, onNotification }) => {
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

  // Backend URLs from environment variables
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  console.log('API Base URL:', API_BASE);

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const [error, setError] = useState(null);
  
  const fetchQuestions = async () => {
    // Don't try to fetch if no exam ID
    if (!exam || !exam.id) {
      console.log('No exam ID available, skipping fetch');
      if (onNotification) {
        onNotification('No exam ID available', 'warning');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Fetching questions for exam:', exam.id);
      
      if (!API_BASE) {
        const errorMsg = 'Backend URL not configured';
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }

      if (onNotification) {
        onNotification('Loading questions...', 'info');
      }

      const response = await fetch(`${API_BASE}/api/teacher/exams/${exam.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      const responseText = await response.text();
      
      // Check if it's HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
        console.error('Full HTML response:', responseText);
        const errorMsg = 'Server returned HTML instead of JSON. Check if the API endpoint exists.';
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }
      
      // Try to parse as JSON
      try {
        const questions = JSON.parse(responseText);
        setQuestions(questions);
        if (onNotification) {
          onNotification(`Loaded ${questions.length} questions`, 'success');
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        const errorMsg = `Server returned non-JSON response: ${responseText.substring(0, 100)}`;
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        if (onNotification) {
          onNotification('Authentication failed. Redirecting to login...', 'error');
        }
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
        const errorMsg = 'Backend URL not configured';
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
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
      
      if (onNotification) {
        onNotification(editingQuestion ? 'Updating question...' : 'Adding question...', 'info');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
      
      if (response.ok) {
        const successMsg = editingQuestion ? 'Question updated!' : 'Question added!';
        if (onNotification) {
          onNotification(successMsg, 'success');
        }
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
      if (onNotification) {
        onNotification(`Error saving question: ${error.message}`, 'error');
      }
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
    if (onNotification) {
      onNotification(`Editing question: ${question.question_text?.substring(0, 50)}...`, 'info');
    }
  };

  const handleDelete = async (questionId) => {
    const questionToDelete = questions.find(q => q.id === questionId);
    if (!window.confirm('Are you sure you want to delete this question?')) {
      if (onNotification) {
        onNotification('Deletion cancelled', 'info');
      }
      return;
    }

    try {
      if (!API_BASE) {
        const errorMsg = 'Backend URL not configured';
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }

      if (onNotification) {
        onNotification('Deleting question...', 'info');
      }

      const response = await fetch(`${API_BASE}/api/teacher/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        if (onNotification) {
          onNotification('Question deleted successfully', 'success');
        }
        fetchQuestions();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      if (onNotification) {
        onNotification(`Error deleting question: ${error.message}`, 'error');
      }
    }
  };

  const handlePublish = async () => {
    try {
      if (!API_BASE) {
        const errorMsg = 'Backend URL not configured';
        if (onNotification) {
          onNotification(errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }

      if (onNotification) {
        onNotification('Publishing exam...', 'info');
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
        const successMsg = 'Exam published successfully! Share this token with students: ' + result.token;
        if (onNotification) {
          onNotification(successMsg, 'success');
        }
        onBack(); // Go back to exam list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to publish exam' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error publishing exam:', error);
      if (onNotification) {
        onNotification(`Error publishing exam: ${error.message}`, 'error');
      }
    }
  };

  const handleToggleForm = () => {
    setShowForm(!showForm);
    if (!showForm && onNotification) {
      onNotification('Adding new question', 'info');
    } else if (onNotification) {
      onNotification('Cancelled question form', 'info');
    }
  };

  const handleBack = () => {
    if (onNotification) {
      onNotification('Returning to exam list', 'info');
    }
    onBack();
  };

  return (
    <div className="question-form">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Manage Questions for {exam.title}</h2>
        <div>
          <button onClick={handleBack} className="btn btn-secondary">Back to Exams</button>
          {exam.status === 'draft' && (
            <button onClick={handleToggleForm} className="btn btn-primary" style={{marginLeft: '10px'}}>
              {showForm ? 'Cancel' : 'Add Question'}
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div style={{ 
        padding: '10px', 
        margin: '10px 0', 
        backgroundColor: API_BASE ? '#d4edda' : '#f8d7da',
        border: `1px solid ${API_BASE ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <strong>Backend Status:</strong> {API_BASE ? `Connected to ${API_BASE}` : 'Not Configured'}
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchQuestions} 
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      )}
      
      {showForm && (
        <form onSubmit={handleSubmit} style={{marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
          <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
          
          <div className="form-group">
            <label>Question Text (optional if image is provided)</label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Question Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          
          <div className="form-group">
            <label>Options</label>
            {['A', 'B', 'C', 'D'].map(option => (
              <div key={option} style={{marginBottom: '10px'}}>
                <label>Option {option}</label>
                <input
                  type="text"
                  name={`option_${option}`}
                  value={formData.options[option]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label>Correct Answer</label>
            <select
              name="correct_answer"
              value={formData.correct_answer}
              onChange={handleChange}
              required
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Marks</label>
            <input
              type="number"
              name="marks"
              value={formData.marks}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || !API_BASE}>
              {loading ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Add Question')}
            </button>
            {!API_BASE && (
              <p style={{color: 'red', marginTop: '10px'}}>
                Cannot save: Backend URL not configured
              </p>
            )}
          </div>
        </form>
      )}
      
      <div style={{marginTop: '20px'}}>
        <h3>Questions ({questions.length})</h3>
        {loading ? (
          <p>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p>No questions added yet. Add your first question!</p>
        ) : (
          <>
            {questions.map((question, index) => (
              <div key={question.id} style={{padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h4>Question {index + 1} ({question.marks} marks)</h4>
                    {question.question_text && <p>{question.question_text}</p>}
                    {question.question_image && (
                      <img src={question.question_image} alt="Question" style={{maxWidth: '200px', maxHeight: '200px'}} />
                    )}
                    <div>
                      <p><strong>Options:</strong></p>
                      <ul>
                        {Object.entries(question.options).map(([key, value]) => (
                          <li key={key} style={{color: key === question.correct_answer ? 'green' : 'inherit', fontWeight: key === question.correct_answer ? 'bold' : 'normal'}}>
                            {key}: {value} {key === question.correct_answer && '(Correct)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {exam.status === 'draft' && (
                    <div>
                      <button onClick={() => handleEdit(question)} style={{marginRight: '10px'}}>Edit</button>
                      <button onClick={() => handleDelete(question.id)} style={{backgroundColor: '#e74c3c'}}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {exam.status === 'draft' && questions.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <button onClick={handlePublish} className="btn btn-primary" disabled={!API_BASE}>
                  Publish Exam
                </button>
                {!API_BASE && (
                  <p style={{color: 'red', marginTop: '10px'}}>
                    Cannot publish: Backend URL not configured
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionForm;