const express = require('express');
const router = express.Router();
const Friend = require('../models/friend');
const auth = require('../auth');

// Send a friend request
router.post('/request', auth, async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;
  
  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }
  
  try {
    await Friend.createRequest(senderId, receiverId);
    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    if (err.message === 'Friend request already exists' || err.message === 'Already friends') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await Friend.getPendingRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a friend request
router.post('/accept/:requestId', auth, async (req, res) => {
  const { requestId } = req.params;
  
  try {
    await Friend.acceptRequest(requestId, req.user.id);
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error(err);
    if (err.message === 'Request not found') {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a friend request
router.post('/reject/:requestId', auth, async (req, res) => {
  const { requestId } = req.params;
  
  try {
    await Friend.rejectRequest(requestId, req.user.id);
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error(err);
    if (err.message === 'Request not found') {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;