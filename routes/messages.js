const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const Friend = require('../models/friend');
const auth = require('../auth');

// Send a message
router.post('/', auth, async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;
  
  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Receiver ID and content are required' });
  }
  
  try {
    // Check if they are friends
    const friends = await Friend.getFriends(senderId);
    const isFriend = friends.some(friend => friend.id === parseInt(receiverId));
    
    if (!isFriend) {
      return res.status(403).json({ message: 'You can only send messages to friends' });
    }
    
    const messageId = await Message.create(senderId, receiverId, content);
    res.status(201).json({ messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation with a friend
router.get('/conversation/:friendId', auth, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;
  
  try {
    // Check if they are friends
    const friends = await Friend.getFriends(userId);
    const isFriend = friends.some(friend => friend.id === parseInt(friendId));
    
    if (!isFriend) {
      return res.status(403).json({ message: 'You can only view conversations with friends' });
    }
    
    const messages = await Message.getConversation(userId, friendId);
    await Promise.all(
      messages
        .filter(msg => msg.receiver_id === userId && !msg.read)
        .map(msg => Message.markAsRead(msg.id, userId))
    );


    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
  
});

// Poll for new messages
router.get('/new/:lastMessageId?', auth, async (req, res) => {
  const lastMessageId = req.params.lastMessageId || 0;
  const userId = req.user.id;
  
  try {
    const messages = await Message.getNewMessages(userId, lastMessageId);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a message as read
router.post('/read/:messageId', auth, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  
  try {
    const changes = await Message.markAsRead(messageId, userId);
    if (changes === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;