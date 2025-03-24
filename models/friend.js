const db = require('../config/database');

class Friend {
  static async createRequest(senderId, receiverId) {
    return new Promise((resolve, reject) => {
      const checkSql = `
        SELECT * FROM friend_requests 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)`;
      
      db.get(checkSql, [senderId, receiverId, receiverId, senderId], (err, row) => {
        if (err) return reject(err);
        if (row) return reject(new Error('Friend request already exists'));

        const checkFriendsSql = `
          SELECT * FROM friends 
          WHERE (user_id = ? AND friend_id = ?) 
             OR (user_id = ? AND friend_id = ?)`;
        
        db.get(checkFriendsSql, [senderId, receiverId, receiverId, senderId], (err, row) => {
          if (err) return reject(err);
          if (row) return reject(new Error('Already friends'));

          const sql = 'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)';
          db.run(sql, [senderId, receiverId], function (err) {
            err ? reject(err) : resolve(this.lastID);
          });
        });
      });
    });
  }

  static async getPendingRequests(userId) {
    const sql = `
      SELECT fr.id, fr.sender_id, u.username AS sender_name, fr.created_at
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [userId], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  }

  static async acceptRequest(requestId, userId) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const getSql = 'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?';
        db.get(getSql, [requestId, userId], (err, request) => {
          if (err || !request) {
            db.run('ROLLBACK');
            return reject(err || new Error('Request not found'));
          }

          const updateSql = 'UPDATE friend_requests SET status = "accepted" WHERE id = ?';
          db.run(updateSql, [requestId], function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            const addFriendSql = 'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)';
            db.run(addFriendSql, [request.receiver_id, request.sender_id, request.sender_id, request.receiver_id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              db.run('COMMIT', (err) => {
                err ? reject(err) : resolve(true);
              });
            });
          });
        });
      });
    });
  }

  static async rejectRequest(requestId, userId) {
    const sql = 'UPDATE friend_requests SET status = "rejected" WHERE id = ? AND receiver_id = ?';

    return new Promise((resolve, reject) => {
      db.run(sql, [requestId, userId], function (err) {
        if (err) return reject(err);
        this.changes === 0 ? reject(new Error('Request not found')) : resolve(true);
      });
    });
  }

  static async getFriends(userId) {
    const sql = `
      SELECT f.friend_id AS id, u.username
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?`;

    return new Promise((resolve, reject) => {
      db.all(sql, [userId], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  }
}

module.exports = Friend;
