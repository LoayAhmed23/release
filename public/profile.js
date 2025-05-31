// profile.js
document.addEventListener('DOMContentLoaded', async function() {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
  
    try {
      // Get current user data
      const userData = await getCurrentUser();
      displayUserProfile(userData);
  
      // Get friends count
      const friends = await getFriends();
      document.getElementById('friends-count').textContent = friends.length;
  
      // Get pending requests count
      const requests = await getFriendRequests();
      document.getElementById('pending-count').textContent = requests.length;
  
      // Display current user in header
      document.getElementById('current-user').textContent = userData.username;
  
      // Setup logout button
      document.getElementById('logout-btn').addEventListener('click', logout);
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile data. Please try again later.');
    }
  });
  
  // Function to display user profile
  function displayUserProfile(user) {
    // Set username in profile
    document.getElementById('username').textContent = user.username;
    document.getElementById('profile-username').textContent = user.username;
    
    // Set avatar with first letter of username
    const avatarElement = document.getElementById('avatar');
    avatarElement.textContent = user.username.charAt(0).toUpperCase();
    
    // Format and display joined date
    const joinedDate = new Date(user.created_at);
    const formattedDate = joinedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    document.getElementById('joined-date').textContent = formattedDate;
  }
  
  // Function to get current user data
  async function getCurrentUser() {
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      }
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user data');
    }
  
    return response.json();
  }
  
  // Function to get friends list
  async function getFriends() {
    const response = await fetch('/api/friends', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      }
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get friends');
    }
  
    return response.json();
  }
  
  // Function to get friend requests
  async function getFriendRequests() {
    const response = await fetch('/api/friends/requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      }
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get friend requests');
    }
  
    return response.json();
  }