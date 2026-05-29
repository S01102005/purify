const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist'); // Compares and points to your model file

// ── Validation Middleware ──────────────────────────────────────────────────
const waitlistValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

// ── POST /api/waitlist ──────────────────────────────────────────────────────
// Handles frontend form submission
router.post('/', waitlistValidation, async (req, res) => {
  // 1. Check for express-validator errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, phone, intendedUse } = req.body;

  try {
    // 2. Check if the email already exists in the waitlist
    const existing = await Waitlist.findOne({ email });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'This email is already on the waitlist.' 
      });
    }

    // 3. Create a new entry using your Mongoose Schema
    await Waitlist.create({
      name,
      email,
      phone: phone || '',
      intendedUse: intendedUse || '',
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || ''
    });

    // 4. CRITICAL FIX: Send a success response back to the frontend!
    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
    });

  } catch (err) {
    // Handle duplicate key error manually just in case
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This email is already on the waitlist.' });
    }
    
    console.error('[Waitlist POST Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── GET /api/waitlist/count ─────────────────────────────────────────────────
// Added since your server.js logs noted this endpoint exists
router.get('/count', async (req, res) => {
  try {
    const count = await Waitlist.countDocuments();
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching count.' });
  }
});

module.exports = router;