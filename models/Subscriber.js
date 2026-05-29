const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    ip: { type: String, default: '' },
    source: {
      type: String,
      enum: ['newsletter_section', 'waitlist', 'other'],
      default: 'newsletter_section',
    },
  },
  {
    timestamps: true,
  }
);

subscriberSchema.index({ email: 1 }, { unique: true });
subscriberSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Subscriber', subscriberSchema);
