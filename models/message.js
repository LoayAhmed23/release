const db = require('../config/database');

class Message {
  static async create(senderId, receiverId, content) {
    const sql = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.run(sql, [senderId, receiverId, content], function (err) {
        err ? reject(err) : resolve(this.lastID);
      });
    });
  }

  static async getConversation(userId, friendId) {
    const sql = `
      SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.read,
             s.username AS sender_name, r.username AS receiver_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `;
    return new Promise((resolve, reject) => {
      db.all(sql, [userId, friendId, friendId, userId], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  }

  static async getNewMessages(userId, lastMessageId = 0) {
    const sql = `
      SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.read,
             s.username AS sender_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE m.receiver_id = ? AND m.id > ? AND m.read = 0
      ORDER BY m.created_at ASC
    `;
    return new Promise((resolve, reject) => {
      db.all(sql, [userId, lastMessageId], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  }

  static async markAsRead(messageId, userId) {
    const sql = 'UPDATE messages SET read = 1 WHERE id = ? AND receiver_id = ?';
    return new Promise((resolve, reject) => {
      db.run(sql, [messageId, userId], function (err) {
        err ? reject(err) : resolve(this.changes);
      });
    });
  }
}

module.exports = Message;
