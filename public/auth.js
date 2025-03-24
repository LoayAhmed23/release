// Auth helper functions

// Check if user is authenticated
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('token');
      return null;
    }
  }
  
  // Get auth token from localStorage
  function getToken() {
    return localStorage.getItem('token');
  }
  
  // API request helper with auth token
  async function authFetch(url, options = {}) {
    const token = getToken();
    
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, mergedOptions);
      
      if (response.status === 401) {
        // Unauthorized, token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
      }
      
      return response;
    } catch (err) {
      console.error('Request error:', err);
      throw err;
    }
  }
  
  // Handle logout
  function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await authFetch('/api/auth/logout', { method: 'POST' });
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        } catch (err) {
          console.error('Logout error:', err);
          // Force logout on error
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        }
      });
    }
  }