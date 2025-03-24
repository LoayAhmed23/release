// Modified chat.js for the split pages structure

let currentChatUser = null;
let pollingInterval = null;
let lastMessageId = 0;

// Check if we're on the index page or chat page
const isIndexPage = window.location.pathname.includes('index.html') || 
                   window.location.pathname === '/' || 
                   window.location.pathname === '';

// Initialize chat application (only runs on index.html)
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const user = await checkAuth();
  
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  // Display current user
  if (document.getElementById('current-user')) {
    document.getElementById('current-user').textContent = user.username;
    document.getElementById('current-user').dataset.id = user.id;
  }
  
  // Setup logout
  setupLogout();
  
  // For index page only
  if (isIndexPage) {
    // Load friends
    await loadFriends();
    
    // Load friend requests
    await loadFriendRequests();
    
    // Setup user search
    setupUserSearch();
  }
});

// Open chat with a friend
function openChat(friendId, friendName) {
  // Update current chat user
  currentChatUser = {
    id: friendId,
    name: friendName
  };
  
  // Update UI
  document.getElementById('chat-header').innerHTML = `
    <button id="back-btn" class="back-btn">← Back</button>
    <h2>Chat with ${friendName}</h2>
    <div></div>
  `;
  
  // Re-attach back button event
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  document.getElementById('messages-container').innerHTML = '';
  
  // Load conversation
  loadConversation(friendId);
  
  // Setup message form
  setupMessageForm();
}

// Load conversation with a friend
async function loadConversation(friendId) {
  try {
    const response = await authFetch(`/api/messages/conversation/${friendId}`);
    
    if (!response.ok) throw new Error('Failed to load conversation');
    
    const messages = await response.json();
    displayMessages(messages);
    
    // Update last message ID for polling
    if (messages.length > 0) {
      lastMessageId = Math.max(...messages.map(msg => msg.id));
    }
  } catch (err) {
    console.error('Error loading conversation:', err);
    document.getElementById('messages-container').innerHTML = 
      '<div class="error">Error loading messages. Please try again.</div>';
  }
}

// Display messages in the chat area
function displayMessages(messages) {
  const messagesContainer = document.getElementById('messages-container');
  
  if (!messagesContainer) return;
  
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="no-messages"><p>No messages yet</p></div>';
    return;
  }
  
  // Get current user
  const currentUserId = document.getElementById('current-user').dataset.id;
  
  // Clear container
  messagesContainer.innerHTML = '';
  
  messages.forEach(message => {
    const messageDiv = document.createElement('div');
    messageDiv.className = message.sender_id == currentUserId ? 'message message-sent' : 'message message-received';
    messageDiv.dataset.id = message.id;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message.content;
    
    const info = document.createElement('div');
    info.className = 'message-info';
    
    // Format timestamp
    const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    info.textContent = `${message.sender_name}, ${time}`;
    
    messageDiv.appendChild(content);
    messageDiv.appendChild(info);
    
    messagesContainer.appendChild(messageDiv);
  });
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup message form
function setupMessageForm() {
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  
  if (!messageForm || !messageInput) return;
  
  messageForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const content = messageInput.value.trim();
    
    if (!content || !currentChatUser) return;
    
    try {
      const response = await authFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: currentChatUser.id,
          content
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Clear input
      messageInput.value = '';
      
      // Reload conversation
      loadConversation(currentChatUser.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
}

// Start polling for new messages
function startPollingForMessages() {
  // Clear any existing interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Poll every 2 seconds
  pollingInterval = setInterval(async () => {
    try {
      // Skip polling if we're not on a chat page
      if (isIndexPage || !currentChatUser) return;
      
      const response = await authFetch(`/api/messages/new/${lastMessageId}`);
      
      if (!response.ok) throw new Error('Failed to poll for new messages');
      
      const newMessages = await response.json();
      
      if (newMessages.length > 0) {
        // Update last message ID
        lastMessageId = Math.max(...newMessages.map(msg => msg.id));
        
        // If we're in a conversation with the sender, add the message to the chat
        const relevantMessages = newMessages.filter(
          msg => msg.sender_id == currentChatUser.id
        );
        
        if (relevantMessages.length > 0) {
          // Reload conversation to show new messages
          loadConversation(currentChatUser.id);
        }
      }
    } catch (err) {
      console.error('Error polling for messages:', err);
    }
  }, 2000);
}