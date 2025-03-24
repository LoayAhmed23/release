const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, password) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      
      return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.run(sql, [username, hash], function (err) {
          err ? reject(err) : resolve(this.lastID);
        });
      });
    } catch (err) {
      throw err;
    }
  }

  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    
    return new Promise((resolve, reject) => {
      db.get(sql, [username], (err, row) => {
        err ? reject(err) : resolve(row);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT id, username, created_at FROM users WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        err ? reject(err) : resolve(row);
      });
    });
  }

  static async searchUsers(query, userId) {
    const sql = `
      SELECT id, username
      FROM users
      WHERE username LIKE ? AND id != ?`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [`%${query}%`, userId], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  }
}

module.exports = User;
