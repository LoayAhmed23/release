const express = require('express');
const router = express.Router();
const auth = require('../auth');
const db = require('../database');

// Get current game state
router.get('/state', auth, (req, res) => {
  db.get('SELECT * FROM game_state WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    res.json({
      clickCount: row?.click_count || 0,
      lastReset: row?.last_reset,
      totalResets: row?.total_resets || 0
    });
  });
});

// Handle click action
router.post('/click', auth, (req, res) => {
  db.serialize(() => {
    db.get('SELECT * FROM game_state WHERE id = 1', (err, gameState) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      const currentCount = gameState?.click_count || 0;
      const newCount = currentCount + 1;
      
      // Check if we've reached 10000
      if (newCount >= 10000) {
        // Reset the game
        db.run(
          'UPDATE game_state SET click_count = 0, last_reset = CURRENT_TIMESTAMP, total_resets = total_resets + 1 WHERE id = 1',
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Server error' });
            }
            
            // Record the click that caused the reset
            db.run(
              'INSERT INTO click_history (user_id, clicks_contributed) VALUES (?, 1)',
              [req.user.id],
              (err) => {
                if (err) console.error('Click history error:', err);
              }
            );
            
            res.json({
              clickCount: 0,
              resetTriggered: true,
              message: 'Congratulations! You triggered the reset at 10,000!'
            });
          }
        );
      } else {
        // Normal click increment
        db.run(
          'UPDATE game_state SET click_count = ? WHERE id = 1',
          [newCount],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Server error' });
            }
            
            // Record the click
            db.run(
              'INSERT INTO click_history (user_id, clicks_contributed) VALUES (?, 1)',
              [req.user.id],
              (err) => {
                if (err) console.error('Click history error:', err);
              }
            );
            
            res.json({
              clickCount: newCount,
              resetTriggered: false
            });
          }
        );
      }
    });
  });
});

// Get top contributors
router.get('/leaderboard', auth, (req, res) => {
  const query = `
    SELECT 
      u.username,
      COUNT(ch.id) as total_clicks,
      MAX(ch.created_at) as last_click
    FROM users u
    LEFT JOIN click_history ch ON u.id = ch.user_id
    GROUP BY u.id, u.username
    HAVING total_clicks > 0
    ORDER BY total_clicks DESC
    LIMIT 10
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    res.json(rows || []);
  });
});

module.exports = router;