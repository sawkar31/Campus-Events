const express = require('express');
const { dbHelpers } = require('../config/database');
const { verifyToken, verifyStudent } = require('./auth');

const router = express.Router();

// Register for event (Student only)
router.post('/register-event', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    // Check if event exists and is active
    const eventSql = 'SELECT * FROM events WHERE id = ? AND status = ?';
    dbHelpers.queryOne(eventSql, [eventId, 'active'], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!event) {
        return res.status(404).json({ error: 'Event not found or not active' });
      }

      // Check if registration deadline has passed
      const now = new Date();
      const deadline = new Date(event.registration_deadline);
      if (now > deadline) {
        return res.status(400).json({ error: 'Registration deadline has passed' });
      }

      // Check if already registered
      const registrationCheckSql = 'SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?';
      dbHelpers.queryOne(registrationCheckSql, [eventId, studentId], (err, existingRegistration) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingRegistration) {
          return res.status(400).json({ error: 'Already registered for this event' });
        }

        // Check if event is full
        const countSql = 'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?';
        dbHelpers.queryOne(countSql, [eventId], (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (result.count >= event.max_participants) {
            return res.status(400).json({ error: 'Event is full' });
          }

          // Register for event
          const registrationData = {
            event_id: eventId,
            student_id: studentId,
            registration_date: new Date().toISOString(),
            status: 'registered'
          };

          dbHelpers.insert('event_registrations', registrationData, (err, registration) => {
            if (err) {
              return res.status(400).json({ error: err.message });
            }

            res.status(201).json({
              message: 'Successfully registered for event',
              registration
            });
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student's registered events (Student only)
router.get('/my-events', verifyToken, verifyStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const sql = `
      SELECT er.*, e.id as event_id, e.title, e.description, e.event_type, 
             e.start_date, e.end_date, e.location, e.image_url,
             a.name as admin_name, a.college as admin_college
      FROM event_registrations er
      LEFT JOIN events e ON er.event_id = e.id
      LEFT JOIN admins a ON e.created_by = a.id
      WHERE er.student_id = ?
      ORDER BY er.registration_date DESC
    `;

    dbHelpers.query(sql, [studentId], (err, registrations) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Format the response
      const formattedRegistrations = registrations.map(reg => ({
        id: reg.id,
        event_id: reg.event_id,
        student_id: reg.student_id,
        registration_date: reg.registration_date,
        check_in_time: reg.check_in_time,
        status: reg.status,
        created_at: reg.created_at,
        event: {
          id: reg.event_id,
          title: reg.title,
          description: reg.description,
          event_type: reg.event_type,
          start_date: reg.start_date,
          end_date: reg.end_date,
          location: reg.location,
          image_url: reg.image_url,
          admin: {
            name: reg.admin_name,
            college: reg.admin_college
          }
        }
      }));

      res.json({ registrations: formattedRegistrations });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check-in for event (Student only)
router.post('/check-in', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    // Check if student is registered for the event
    const registrationSql = 'SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?';
    dbHelpers.queryOne(registrationSql, [eventId, studentId], (err, registration) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!registration) {
        return res.status(404).json({ error: 'Not registered for this event' });
      }

      if (registration.status === 'checked_in') {
        return res.status(400).json({ error: 'Already checked in' });
      }

      // Check if event has started
      const eventSql = 'SELECT start_date FROM events WHERE id = ?';
      dbHelpers.queryOne(eventSql, [eventId], (err, event) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }

        const now = new Date();
        const eventStart = new Date(event.start_date);
        
        // Allow check-in 30 minutes before event starts
        const checkInTime = new Date(eventStart.getTime() - 30 * 60 * 1000);
        
        if (now < checkInTime) {
          return res.status(400).json({ 
            error: 'Check-in not available yet. Check-in opens 30 minutes before event starts.' 
          });
        }

        // Update registration status to checked_in
        const updateData = {
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        };

        dbHelpers.update('event_registrations', registration.id, updateData, (err, updatedRegistration) => {
          if (err) {
            return res.status(400).json({ error: err.message });
          }

          res.json({
            message: 'Successfully checked in',
            registration: updatedRegistration
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel event registration (Student only)
router.delete('/cancel-registration/:eventId', verifyToken, verifyStudent, async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    // Check if registration exists
    const registrationSql = 'SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?';
    dbHelpers.queryOne(registrationSql, [eventId, studentId], (err, registration) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (registration.status === 'checked_in') {
        return res.status(400).json({ error: 'Cannot cancel after check-in' });
      }

      // Delete registration
      dbHelpers.delete('event_registrations', registration.id, (err, result) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        res.json({ message: 'Registration cancelled successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student profile (Student only)
router.get('/profile', verifyToken, verifyStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const sql = 'SELECT id, name, email, student_id, college, phone, created_at FROM students WHERE id = ?';
    dbHelpers.queryOne(sql, [studentId], (err, student) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      res.json({ student });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student profile (Student only)
router.put('/profile', verifyToken, verifyStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { name, phone } = req.body;

    const updateData = { name, phone };
    dbHelpers.update('students', studentId, updateData, (err, student) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Get updated student data
      const sql = 'SELECT id, name, email, student_id, college, phone FROM students WHERE id = ?';
      dbHelpers.queryOne(sql, [studentId], (err, updatedStudent) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          message: 'Profile updated successfully',
          student: updatedStudent
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
