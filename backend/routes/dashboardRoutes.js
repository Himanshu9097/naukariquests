const express = require('express');
const router = express.Router();
const {
  getRecruiterJobs, createRecruiterJob, updateRecruiterJob, deleteRecruiterJob,
  getApplications, updateApplicationStatus,
  createSchedule, getSchedules, updateSchedule, deleteSchedule,
  getRecruiterStats,
  applyForJob, getCandidateApplications, getCandidateStats, getCandidateSchedules, submitMockTest, getMockTestQuestions
} = require('../controllers/dashboardController');

// Recruiter routes
router.get('/recruiter/stats', getRecruiterStats);
router.get('/recruiter/jobs', getRecruiterJobs);
router.post('/recruiter/jobs', createRecruiterJob);
router.put('/recruiter/jobs/:id', updateRecruiterJob);
router.delete('/recruiter/jobs/:id', deleteRecruiterJob);
router.get('/recruiter/applications', getApplications);
router.put('/recruiter/applications/:id', updateApplicationStatus);
router.get('/recruiter/schedules', getSchedules);
router.post('/recruiter/schedules', createSchedule);
router.put('/recruiter/schedules/:id', updateSchedule);
router.delete('/recruiter/schedules/:id', deleteSchedule);

// Candidate routes
router.post('/candidate/apply', applyForJob);
router.get('/candidate/:candidateId/applications', getCandidateApplications);
router.get('/candidate/:candidateId/stats', getCandidateStats);
router.get('/candidate/:candidateId/schedules', getCandidateSchedules);
router.post('/candidate/:candidateId/mocktest', submitMockTest);
router.get('/candidate/mocktest/questions/:type', getMockTestQuestions);

module.exports = router;
