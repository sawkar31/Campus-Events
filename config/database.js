const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '..', 'database', 'campus_events.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create admins table
      db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          college TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create students table
      db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          student_id TEXT UNIQUE NOT NULL,
          college TEXT NOT NULL,
          phone TEXT,
          role TEXT DEFAULT 'student',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create events table
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          event_type TEXT NOT NULL,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          location TEXT NOT NULL,
          max_participants INTEGER NOT NULL,
          registration_deadline DATETIME NOT NULL,
          requirements TEXT,
          prizes TEXT,
          contact_info TEXT,
          image_url TEXT,
          created_by INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES admins (id)
        )
      `);

      // Create event_registrations table
      db.run(`
        CREATE TABLE IF NOT EXISTS event_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          check_in_time DATETIME,
          status TEXT DEFAULT 'registered',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
          UNIQUE(event_id, student_id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_event_registrations_student_id ON event_registrations(student_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status)`);

      // Create default admin user
      db.get(`SELECT COUNT(*) as count FROM admins`, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row.count === 0) {
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync('admin123', 12);
          
          db.run(`
            INSERT INTO admins (email, password, name, college, role)
            VALUES (?, ?, ?, ?, ?)
          `, ['admin@college.edu', hashedPassword, 'Admin User', 'Default College', 'admin'], (err) => {
            if (err) {
              console.error('Error creating default admin:', err);
            } else {
              console.log('Default admin created: admin@college.edu / admin123');
            }
          });
        }
      });

      resolve();
    });
  });
}

// Database helper functions
const dbHelpers = {
  // Get all records from a table
  getAll: (table, callback) => {
    db.all(`SELECT * FROM ${table}`, callback);
  },

  // Get a single record by ID
  getById: (table, id, callback) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], callback);
  },

  // Get a single record by email
  getByEmail: (table, email, callback) => {
    db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], callback);
  },

  // Insert a new record
  insert: (table, data, callback) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    db.run(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values, function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { id: this.lastID, ...data });
      }
    });
  },

  // Update a record
  update: (table, id, data, callback) => {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values, function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { id, ...data });
      }
    });
  },

  // Delete a record
  delete: (table, id, callback) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { changes: this.changes });
      }
    });
  },

  // Custom query
  query: (sql, params = [], callback) => {
    db.all(sql, params, callback);
  },

  // Get single record with custom query
  queryOne: (sql, params = [], callback) => {
    db.get(sql, params, callback);
  }
};

module.exports = { db, initializeDatabase, dbHelpers };
