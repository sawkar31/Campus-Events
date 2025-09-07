const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../config/database');

const router = express.Router();

// Register admin
router.post('/register-admin', async (req, res) => {
  try {
    const { email, password, name, college } = req.body;

    // Check if admin already exists
    dbHelpers.getByEmail('admins', email, (err, existingAdmin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingAdmin) {
        return res.status(400).json({ error: 'Admin already exists' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 12);

      // Create admin in SQLite
      const adminData = {
        email,
        password: hashedPassword,
        name,
        college,
        role: 'admin'
      };

      dbHelpers.insert('admins', adminData, (err, admin) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345';
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

        
        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: 'admin' },
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );

        res.status(201).json({
          message: 'Admin registered successfully',
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            college: admin.college
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login admin
router.post('/login-admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get admin from database
    dbHelpers.getByEmail('admins', email, (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = bcrypt.compareSync(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345';
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
      
      console.log('JWT_SECRET in auth:', jwtSecret ? 'Loaded' : 'NOT LOADED');
      console.log('JWT_EXPIRES_IN in auth:', jwtExpiresIn);
      
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      res.json({
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          college: admin.college
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register student
router.post('/register-student', async (req, res) => {
  try {
    const { email, password, name, studentId, college, phone } = req.body;

    // Check if student already exists
    dbHelpers.getByEmail('students', email, (err, existingStudent) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingStudent) {
        return res.status(400).json({ error: 'Student already exists' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 12);

      // Create student in SQLite
      const studentData = {
        email,
        password: hashedPassword,
        name,
        student_id: studentId,
        college,
        phone,
        role: 'student'
      };

      dbHelpers.insert('students', studentData, (err, student) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345';
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        
        const token = jwt.sign(
          { id: student.id, email: student.email, role: 'student' },
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );

        res.status(201).json({
          message: 'Student registered successfully',
          token,
          student: {
            id: student.id,
            email: student.email,
            name: student.name,
            studentId: student.student_id,
            college: student.college
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login student
router.post('/login-student', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get student from database
    dbHelpers.getByEmail('students', email, (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!student) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = bcrypt.compareSync(password, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345';
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
      
      const token = jwt.sign(
        { id: student.id, email: student.email, role: 'student' },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      res.json({
        message: 'Login successful',
        token,
        student: {
          id: student.id,
          email: student.email,
          name: student.name,
          studentId: student.student_id,
          college: student.college
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Verify admin middleware
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Verify student middleware
const verifyStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Student role required.' });
  }
  next();
};

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
module.exports.verifyStudent = verifyStudent;
