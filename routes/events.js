const express = require('express');
const { dbHelpers } = require('../config/database');
const { verifyToken, verifyAdmin } = require('./auth');

const router = express.Router();

// Create event (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      maxParticipants,
      registrationDeadline,
      requirements,
      prizes,
      contactInfo,
      imageUrl
    } = req.body;

    const eventData = {
      title,
      description,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate,
      location,
      max_participants: maxParticipants,
      registration_deadline: registrationDeadline,
      requirements,
      prizes,
      contact_info: contactInfo,
      image_url: imageUrl,
      created_by: req.user.id,
      status: 'active'
    };

    dbHelpers.insert('events', eventData, (err, event) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      res.status(201).json({
        message: 'Event created successfully',
        event
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all events (Public)
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT e.*, a.name as admin_name, a.college as admin_college
      FROM events e
      LEFT JOIN admins a ON e.created_by = a.id
      WHERE e.status = 'active'
      ORDER BY e.created_at DESC
    `;

    dbHelpers.query(sql, [], (err, events) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Format events to match expected structure
      const formattedEvents = events.map(event => ({
        ...event,
        admin: {
          name: event.admin_name,
          college: event.admin_college
        }
      }));

      res.json({ events: formattedEvents });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get event by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT e.*, a.name as admin_name, a.college as admin_college
      FROM events e
      LEFT JOIN admins a ON e.created_by = a.id
      WHERE e.id = ?
    `;

    dbHelpers.queryOne(sql, [id], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get registrations for this event
      const registrationsSql = `
        SELECT er.*, s.name as student_name, s.student_id, s.college as student_college
        FROM event_registrations er
        LEFT JOIN students s ON er.student_id = s.id
        WHERE er.event_id = ?
      `;

      dbHelpers.query(registrationsSql, [id], (err, registrations) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Format the response
        const formattedEvent = {
          ...event,
          admin: {
            name: event.admin_name,
            college: event.admin_college
          },
          registrations: registrations.map(reg => ({
            ...reg,
            student: {
              name: reg.student_name,
              student_id: reg.student_id,
              college: reg.student_college
            }
          }))
        };

        res.json({ event: formattedEvent });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // First check if event exists and belongs to the admin
    const checkSql = 'SELECT * FROM events WHERE id = ? AND created_by = ?';
    dbHelpers.queryOne(checkSql, [id, req.user.id], (err, existingEvent) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found or access denied' });
      }

      // Update the event
      dbHelpers.update('events', id, updateData, (err, event) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        res.json({
          message: 'Event updated successfully',
          event
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First check if event exists and belongs to the admin
    const checkSql = 'SELECT * FROM events WHERE id = ? AND created_by = ?';
    dbHelpers.queryOne(checkSql, [id, req.user.id], (err, existingEvent) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found or access denied' });
      }

      // Update event status to cancelled
      dbHelpers.update('events', id, { status: 'cancelled' }, (err, result) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        res.json({ message: 'Event cancelled successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get events by admin (Admin only)
router.get('/admin/my-events', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT e.*
      FROM events e
      WHERE e.created_by = ?
      ORDER BY e.created_at DESC
    `;

    dbHelpers.query(sql, [req.user.id], (err, events) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Get registrations for each event
      const eventsWithRegistrations = events.map(event => {
        return new Promise((resolve) => {
          const registrationsSql = `
            SELECT er.*, s.name as student_name, s.student_id, s.college as student_college
            FROM event_registrations er
            LEFT JOIN students s ON er.student_id = s.id
            WHERE er.event_id = ?
          `;

          dbHelpers.query(registrationsSql, [event.id], (err, registrations) => {
            if (err) {
              resolve({ ...event, registrations: [] });
            } else {
              const formattedRegistrations = registrations.map(reg => ({
                ...reg,
                student: {
                  name: reg.student_name,
                  student_id: reg.student_id,
                  college: reg.student_college
                }
              }));
              resolve({ ...event, registrations: formattedRegistrations });
            }
          });
        });
      });

      Promise.all(eventsWithRegistrations).then(formattedEvents => {
        res.json({ events: formattedEvents });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get event statistics (Admin only)
router.get('/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT e.id, e.title, e.max_participants,
             COUNT(er.id) as current_registrations
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.created_by = ?
      GROUP BY e.id, e.title, e.max_participants
    `;

    dbHelpers.query(sql, [req.user.id], (err, events) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const stats = events.map(event => ({
        id: event.id,
        title: event.title,
        maxParticipants: event.max_participants,
        currentRegistrations: event.current_registrations,
        availableSpots: event.max_participants - event.current_registrations
      }));

      res.json({ stats });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
