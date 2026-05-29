const express = require('express');
const { body, validationResult } = require('express-validator');
const Subscriber = require('../models/Subscriber');

const router = express.Router();

// ── Validation ────────────────────────────────────────────────────────────────
const emailValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

// ── POST /api/newsletter ──────────────────────────────────────────────────────
// Subscribe to newsletter
router.post('/', emailValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, source = 'newsletter_section' } = req.body;

  try {
    const existing = await Subscriber.findOne({ email });

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Re-subscribe
        existing.status = 'active';
        await existing.save();
        return res.json({ success: true, message: 'Welcome back! You\'ve been re-subscribed.' });
      }
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }

    await Subscriber.create({ email, source, ip: req.ip || '' });

    return res.status(201).json({
      success: true,
      message: 'Subscribed! Expect updates from team@pureair.in',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }
    console.error('[Newsletter POST]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── DELETE /api/newsletter/unsubscribe ────────────────────────────────────────
// Unsubscribe by email
router.delete('/unsubscribe', emailValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const subscriber = await Subscriber.findOne({ email: req.body.email });
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }
    subscriber.status = 'unsubscribed';
    await subscriber.save();
    return res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/newsletter (admin-only) ─────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = status === 'all' ? {} : { status };

    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-ip -__v'),
      Subscriber.countDocuments(filter),
    ]);

    return res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: subscribers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── Admin middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  next();
}

module.exports = router;
