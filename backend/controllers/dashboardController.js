const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Schedule = require('../models/Schedule');
const ResumeAnalysis = require('../models/ResumeAnalysis');

function getRecruiterFilter(req) {
  const { recruiterId } = req.query;
  if (recruiterId && mongoose.isValidObjectId(recruiterId)) {
    return { recruiterId }; // assumes models have recruiterId
  }
  return {};
}

function getValidCandidateId(candidateId) {
  return candidateId && mongoose.isValidObjectId(candidateId) ? candidateId : null;
}

// ─── RECRUITER: Get my posted jobs ──────────────────────────────────────────
const getRecruiterJobs = async (req, res) => {
  try {
    const filter = getRecruiterFilter(req);
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch jobs' }); }
};

// ─── RECRUITER: Create a new job ────────────────────────────────────────────
const createRecruiterJob = async (req, res) => {
  try {
    const job = new Job(req.body);
    const saved = await job.save();
    res.status(201).json(saved);

    // Fire-and-forget: blast email + in-app notifications to ALL candidates
    const { blastJobNotification } = require('../services/emailService');
    setImmediate(() => blastJobNotification(saved));
  } catch (e) {
    console.error('Create job error:', e.message);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

// ─── RECRUITER: Update job ──────────────────────────────────────────────────
const updateRecruiterJob = async (req, res) => {
  try {
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Job not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update job' }); }
};

// ─── RECRUITER: Delete job ──────────────────────────────────────────────────
const deleteRecruiterJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed to delete job' }); }
};

// ─── RECRUITER: Get all applications for their jobs ─────────────────────────
const getApplications = async (req, res) => {
  try {
    const filter = getRecruiterFilter(req);
    // Find recruiter's jobs first
    const jobs = await Job.find(filter).select('_id');
    const jobIds = jobs.map(j => j._id);
    
    const apps = await Application.find(filter.recruiterId ? { jobId: { $in: jobIds } } : {})
      .populate('jobId', 'title company location')
      .populate('candidateId', 'name email jobFitScore avatarUrl resumeUrl')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch applications' }); }
};

// ─── RECRUITER: Update application status ───────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Step 1: update the document
    let app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Step 2: explicit populate (more reliable than chaining)
    await app.populate('jobId', 'title company');
    await app.populate('candidateId', 'name email');

    res.json(app);

    console.log(`🔔 Status changed → ${status} | candidate: ${app.candidateId?.email} | job: ${app.jobId?.title}`);

    // Fire-and-forget notifications
    if (app.candidateId?.email && app.jobId && status !== 'applied') {
      setImmediate(async () => {
        try {
          const { sendStatusUpdateEmail } = require('../services/emailService');
          const Candidate = require('../models/Candidate');

          // Email notification
          await sendStatusUpdateEmail({
            to: app.candidateId.email,
            candidateName: app.candidateId.name,
            jobTitle: app.jobId.title,
            companyName: app.jobId.company,
            newStatus: status,
          });

          // In-app notification (best effort)
          if (app.candidateId._id) {
            await Candidate.findOneAndUpdate(
              { userId: app.candidateId._id },
              {
                $push: {
                  notifications: {
                    message: `Your application for "${app.jobId.title}" at ${app.jobId.company} has been moved to ${status}.`,
                    jobId: app.jobId._id,
                    read: false,
                    createdAt: new Date(),
                  },
                },
              },
              { upsert: true }
            );
          }
        } catch (notifErr) {
          console.error('Status update notification failed:', notifErr.message);
        }
      });
    }

  } catch (e) {
    console.error('Status update error:', e);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// ─── RECRUITER: Schedule interview/exam ─────────────────────────────────────
const createSchedule = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.link) {
      // Auto-generate Google Meet link if none provided
      const randomString = Math.random().toString(36).substring(2, 12).match(/.{1,3}/g).join('-');
      body.link = `https://meet.google.com/${randomString}`;
    }
    const schedule = new Schedule(body);
    const saved = await schedule.save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to create schedule' }); }
};

const getSchedules = async (req, res) => {
  try {
    const filter = getRecruiterFilter(req);
    const schedules = await Schedule.find(filter)
      .populate('jobId', 'title company')
      .sort({ date: 1 });
    res.json(schedules);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch schedules' }); }
};

const updateSchedule = async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Failed to update schedule' }); }
};

const deleteSchedule = async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed to delete schedule' }); }
};

// ─── RECRUITER: Dashboard stats ─────────────────────────────────────────────
const getRecruiterStats = async (req, res) => {
  try {
    const filter = getRecruiterFilter(req);
    const totalJobs = await Job.countDocuments(filter);
    
    // Find recruiter's jobs to filter apps
    const jobs = await Job.find(filter).select('_id');
    const jobIds = jobs.map(j => j._id);
    const appFilter = filter.recruiterId ? { jobId: { $in: jobIds } } : {};

    const totalApps = await Application.countDocuments(appFilter);
    const shortlisted = await Application.countDocuments({ ...appFilter, status: 'shortlisted' });
    const interviews = await Schedule.countDocuments({ ...filter, type: 'interview' });
    const exams = await Schedule.countDocuments({ ...filter, type: 'exam' });
    const hired = await Application.countDocuments({ ...appFilter, status: 'hired' });
    res.json({ totalJobs, totalApps, shortlisted, interviews, exams, hired });
  } catch (e) { res.status(500).json({ error: 'Stats fetch failed' }); }
};

// ─── CANDIDATE: Apply for a job ─────────────────────────────────────────────
const applyForJob = async (req, res) => {
  try {
    const existing = await Application.findOne({ jobId: req.body.jobId, candidateId: req.body.candidateId });
    if (existing) return res.status(400).json({ error: 'Already applied for this job' });
    
    const app = new Application(req.body);
    const saved = await app.save();
    res.status(201).json(saved);
  } catch (e) { res.status(500).json({ error: 'Failed to apply' }); }
};

// ─── CANDIDATE: Get my applications ─────────────────────────────────────────
const getCandidateApplications = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const validCandidateId = getValidCandidateId(candidateId);
    if (!validCandidateId) {
      return res.json([]);
    }

    const filter = { candidateId: validCandidateId };
    const apps = await Application.find(filter)
      .populate('jobId', 'title company location salary type')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch applications' }); }
};

// ─── CANDIDATE: Dashboard stats ─────────────────────────────────────────────
const getCandidateStats = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const validCandidateId = getValidCandidateId(candidateId);
    if (!validCandidateId) {
      return res.json({
        totalApps: 0,
        shortlisted: 0,
        interviews: 0,
        hired: 0,
        analysisCount: 0,
        latestAtsScore: null,
        jobFitScore: 0,
      });
    }

    const filter = { candidateId: validCandidateId };
    const totalApps = await Application.countDocuments(filter);
    const shortlisted = await Application.countDocuments({ ...filter, status: 'shortlisted' });
    const interviews = await Application.countDocuments({ ...filter, status: 'interview' });
    const hired = await Application.countDocuments({ ...filter, status: 'hired' });
    const analysisCount = await ResumeAnalysis.countDocuments();
    const latestAnalysis = await ResumeAnalysis.findOne().sort({ createdAt: -1 });
    
    const User = require('../models/User');
    const user = await User.findById(validCandidateId).select('jobFitScore');
    const jobFitScore = user?.jobFitScore || 0;

    res.json({ 
      totalApps, shortlisted, interviews, hired, 
      analysisCount, latestAtsScore: latestAnalysis?.ats_score ?? null,
      jobFitScore
    });
  } catch (e) { res.status(500).json({ error: 'Stats fetch failed' }); }
};

// ─── CANDIDATE: Get upcoming schedules ──────────────────────────────────────
const getCandidateSchedules = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const validCandidateId = getValidCandidateId(candidateId);
    if (!validCandidateId) {
      return res.json([]);
    }

    // Find jobs the candidate explicitly applied for
    const apps = await Application.find({ candidateId: validCandidateId }).select('jobId');
    const appliedJobIds = apps.map(app => app.jobId);

    // Find schedules where:
    // 1. The candidate is explicitly in the candidates array, OR
    // 2. The candidates array is empty (legacy/all-applicants) AND the candidate applied for that job
    const schedules = await Schedule.find({ 
      status: 'scheduled', 
      date: { $gte: new Date() },
      $or: [
        { candidates: validCandidateId },
        { candidates: { $size: 0 }, jobId: { $in: appliedJobIds } },
        { candidates: { $exists: false }, jobId: { $in: appliedJobIds } },
      ]
    })
      .populate('jobId', 'title company')
      .sort({ date: 1 });
    res.json(schedules);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch schedules' }); }
};

// ─── CANDIDATE: Submit Mock Test ────────────────────────────────────────────
const submitMockTest = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { pointsEarned } = req.body;
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(candidateId, { $inc: { jobFitScore: pointsEarned || 10 } }, { new: true });
    res.json({ success: true, jobFitScore: user?.jobFitScore || 0 });
  } catch (e) { res.status(500).json({ error: 'Failed to submit mock test' }); }
};

const getMockTestQuestions = async (req, res) => {
  try {
    const { type } = req.params;
    const Question = require('../models/Question');
    const questions = await Question.aggregate([
      { $match: { type: type } },
      { $sample: { size: 5 } } // deliver 5 random questions for a speedy test
    ]);
    res.json(questions);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch mock test questions' }); }
};

module.exports = {
  getRecruiterJobs, createRecruiterJob, updateRecruiterJob, deleteRecruiterJob,
  getApplications, updateApplicationStatus,
  createSchedule, getSchedules, updateSchedule, deleteSchedule,
  getRecruiterStats,
  applyForJob, getCandidateApplications, getCandidateStats, getCandidateSchedules, submitMockTest, getMockTestQuestions
};
