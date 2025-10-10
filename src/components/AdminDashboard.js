// frontend/src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import api from '../utils/axiosConfig';

const AdminDashboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('[DEBUG] AdminDashboard mounted, user:', user);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[DEBUG] Fetching users with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched users:', response.data);
      setUsers(response.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.response?.status === 401) {
        // Only clear regular user tokens, not admin-specific ones
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (onLogout) onLogout();
      } else {
        setError(err.response?.data?.message || 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('User role updated successfully');
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('User deleted successfully');
      setUsers(users.filter(u => u.id !== userId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Admin Dashboard</h1>
            <p>Manage users and system settings</p>
          </div>
          <div className="admin-user-info">
            <span>Welcome, <strong>{user?.name || 'Admin'}</strong> ({user?.email})</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{users.length}</p>
          </div>
          <div className="stat-card">
            <h3>Students</h3>
            <p className="stat-number">{users.filter(u => u.role === 'student').length}</p>
          </div>
          <div className="stat-card">
            <h3>Teachers</h3>
            <p className="stat-number">{users.filter(u => u.role === 'teacher').length}</p>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <p className="stat-number">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>

        <div className="users-table-container">
          <div className="table-header">
            <h2>User Management</h2>
            <button onClick={fetchUsers} className="refresh-btn">
              Refresh
            </button>
          </div>
          
          {users.length === 0 ? (
            <div className="no-users">
              <p>No users found in the system.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={u.role === 'admin' ? 'admin-row' : ''}>
                      <td>{u.id}</td>
                      <td className="user-name">
                        <div className="name-avatar">
                          <div className="avatar">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          {u.name || 'No Name'}
                        </div>
                      </td>
                      <td className="user-email">{u.email || 'N/A'}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`role-select ${u.role}`}
                          disabled={u.id === user?.id} // Don't let admin change their own role
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="delete-btn"
                          disabled={u.role === 'admin' || u.id === user?.id}
                          title={u.id === user?.id ? "Cannot delete your own account" : u.role === 'admin' ? "Cannot delete admin users" : "Delete user"}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;