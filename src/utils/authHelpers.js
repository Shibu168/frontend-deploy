// authHelpers.js
export const getValidToken = () => {
  try {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken || storedToken === 'null' || storedToken === 'undefined') {
      return null;
    }
    
    // Handle different token storage formats
    if (storedToken.startsWith('{')) {
      try {
        const tokenObj = JSON.parse(storedToken);
        return tokenObj.idToken || tokenObj.token || tokenObj.accessToken || null;
      } catch (e) {
        console.error('Error parsing token object:', e);
        return null;
      }
    }
    
    return storedToken;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Simple validation - you can add more sophisticated checks
    const parts = token.split('.');
    return parts.length === 3; // JWT should have 3 parts
  } catch (error) {
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};