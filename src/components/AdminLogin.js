// frontend/src/components/AdminLogin.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebase'; // Your Firebase config
import api from '../utils/axiosConfig';
import './Auth.css';

const AdminLogin = ({ onAdminLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth(app);

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

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      console.log('[DEBUG] Firebase user:', user);
      
      // 2. Get Firebase ID token
      const idToken = await user.getIdToken();
      console.log('[DEBUG] Firebase ID token obtained');
      
      // 3. Send token to your backend to verify admin role
      const response = await api.post('/api/admin/verify', {}, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const adminUser = response.data.user;
      console.log('[DEBUG] Admin user verified:', adminUser);
      
      // Store token and user data
      localStorage.setItem('adminToken', idToken); // Store Firebase token
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      
      // Call the parent callback if provided
      if (onAdminLogin) {
        onAdminLogin(adminUser, idToken);
      }
      
      // Navigate to admin dashboard
      navigate('/admin-dashboard', { state: { user: adminUser } });
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.code === 'auth/invalid-credential') {
        console.log('Invalid email or password.');
      } else if (error.code === 'auth/user-not-found') {
        console.log('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        console.log('Incorrect password.');
      } else if (error.response?.data?.message) {
        console.log(error.response.data.message);
      } else {
        console.log('Login failed. Please try again.');
      }
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
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
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