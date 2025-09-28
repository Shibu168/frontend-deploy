// frontend/src/components/AdminLogin.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const AdminLogin = ({ onAdminLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // DEBUG: Check what's being sent
    console.log('Submitting email:', formData.email);
    console.log('Email type:', typeof formData.email);
    console.log('Email value (stringified):', JSON.stringify(formData.email));

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        email: formData.email,
        password: formData.password
      });
    // ... rest of your code

    const { token, user } = response.data;
    
    // Store token and user data
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    
    // Call the parent callback if provided
    // if (onAdminLogin) {
    //   onAdminLogin(user, token);  // Check what onAdminLogin does
    // }
    
    // Navigate to admin dashboard
    navigate('/admin-dashboard', { state: { user } });
    
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password (Firebase UID)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your Firebase UID"
            />
            <small className="help-text">
              Use your Firebase UID as password
            </small>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
        <p>
          <Link to="/">Back to User Login</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;