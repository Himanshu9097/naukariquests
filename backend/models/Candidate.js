const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: { type: String },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const CandidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  title: { type: String },
  experience: { type: String },
  skills: [{ type: String }],
  summary: { type: String },
  linkedin: { type: String },
  github: { type: String },
  education: { type: String },
  ats_score: { type: Number },
  avatarUrl: { type: String },       // ImageKit URL for profile photo
  resumeUrl: { type: String },       // ImageKit URL
  resumeText: { type: String },      // Extracted raw text for matching
  jobFitScore: { type: Number, default: 0 },
  notifications: [NotificationSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Candidate', CandidateSchema);
