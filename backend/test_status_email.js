require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const { sendStatusUpdateEmail } = require('./services/emailService');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const info = await sendStatusUpdateEmail({
    to: process.env.EMAIL_USER,
    candidateName: 'Test Candidate',
    jobTitle: 'Frontend Developer',
    companyName: 'NaukriQuest Inc.',
    oldStatus: 'applied',
    newStatus: 'shortlisted'
  });

  console.log('Result:', info);
  mongoose.disconnect();
}
test().catch(console.error);
