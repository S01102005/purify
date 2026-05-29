const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    intendedUse: {
      type: String,
      enum: ['hostel', 'home', 'office', 'other', ''],
      default: '',
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referrer: { type: String, default: '' },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

// Compound index: fast email lookups, prevents duplicates
waitlistSchema.index({ email: 1 }, { unique: true });
waitlistSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);