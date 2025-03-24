// Friends functionality

// Load user's friends
async function loadFriends() {
    try {
      const response = await authFetch('/api/friends');
      if (!response.ok) throw new Error('Failed to load friends');
      
      const friends = await response.json();
      displayFriends(friends);
      return friends;
    } catch (err) {
      console.error('Error loading friends:', err);
      return [];
    }
  }
  
  // Display friends in the sidebar
  function displayFriends(friends) {
    const friendsList = document.getElementById('friends-list');
    
    if (!friendsList) return;
    
    friendsList.innerHTML = '';
    
    if (friends.length === 0) {
      friendsList.innerHTML = '<li class="no-friends">No friends yet</li>';
      return;
    }
    
    friends.forEach(friend => {
      const li = document.createElement('li');
      li.className = 'friend-item';
      li.dataset.id = friend.id;
      li.textContent = friend.username;
      
      li.addEventListener('click', () => {
        openChat(friend.id, friend.username);
        // Add active class to selected friend
        document.querySelectorAll('.friend-item').forEach(item => {
          item.classList.remove('active');
        });
        li.classList.add('active');
      });
      
      friendsList.appendChild(li);
    });
  }
  
  // Load friend requests
  async function loadFriendRequests() {
    try {
      const response = await authFetch('/api/friends/requests');
      if (!response.ok) throw new Error('Failed to load friend requests');
      
      const requests = await response.json();
      displayFriendRequests(requests);
    } catch (err) {
      console.error('Error loading friend requests:', err);
    }
  }
  
  // Display friend requests
  function displayFriendRequests(requests) {
    const requestsList = document.getElementById('requests-list');
    
    if (!requestsList) return;
    
    requestsList.innerHTML = '';
    
    if (requests.length === 0) {
      requestsList.innerHTML = '<li class="no-requests">No pending requests</li>';
      return;
    }
    
    requests.forEach(request => {
      const li = document.createElement('li');
      li.className = 'request-item';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = request.sender_name;
      
      const actionsDiv = document.createElement('div');
      
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'btn-action';
      acceptBtn.textContent = 'Accept';
      acceptBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await acceptFriendRequest(request.id);
      });
      
      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn-action btn-reject';
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await rejectFriendRequest(request.id);
      });
      
      actionsDiv.appendChild(acceptBtn);
      actionsDiv.appendChild(rejectBtn);
      
      li.appendChild(nameSpan);
      li.appendChild(actionsDiv);
      
      requestsList.appendChild(li);
    });
  }
  
  // Accept friend request
  async function acceptFriendRequest(requestId) {
    try {
      const response = await authFetch(`/api/friends/accept/${requestId}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to accept friend request');
      
      // Reload friends and requests
      await loadFriendRequests();
      await loadFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  }
  
  // Reject friend request
  async function rejectFriendRequest(requestId) {
    try {
      const response = await authFetch(`/api/friends/reject/${requestId}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to reject friend request');
      
      // Reload requests
      await loadFriendRequests();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  }
  
  // Setup user search functionality
  function setupUserSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchBtn || !searchInput || !searchResults) return;
    
    searchBtn.addEventListener('click', async () => {
      const query = searchInput.value.trim();
      
      if (!query) return;
      
      try {
        const response = await authFetch(`/api/auth/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error('Search failed');
        
        const users = await response.json();
        
        searchResults.innerHTML = '';
        
        if (users.length === 0) {
          searchResults.innerHTML = '<div class="search-result-item">No users found</div>';
          return;
        }
        
        users.forEach(user => {
          const div = document.createElement('div');
          div.className = 'search-result-item';
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = user.username;
          
          const addBtn = document.createElement('button');
          addBtn.className = 'btn-action';
          addBtn.textContent = 'Add Friend';
          addBtn.addEventListener('click', async () => {
            await sendFriendRequest(user.id);
          });
          
          div.appendChild(nameSpan);
          div.appendChild(addBtn);
          
          searchResults.appendChild(div);
        });
      } catch (err) {
        console.error('Search error:', err);
        searchResults.innerHTML = '<div class="search-result-item error">Error searching users</div>';
      }
    });
    
    // Also trigger search on Enter key
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });
  }
  
  // Send friend request
  async function sendFriendRequest(receiverId) {
    try {
      const response = await authFetch('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      });
      
      const data = await response.json();
      
      const searchResults = document.getElementById('search-results');
      
      if (!response.ok) {
        searchResults.innerHTML = `<div class="search-result-item error">${data.message}</div>`;
        return;
      }
      
      searchResults.innerHTML = '<div class="search-result-item success">Friend request sent!</div>';
    } catch (err) {
      console.error('Error sending friend request:', err);
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '<div class="search-result-item error">Error sending friend request</div>';
    }
  }