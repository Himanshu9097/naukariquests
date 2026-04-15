const User = require('../models/User');

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const PK = process.env.IMAGEKIT_PRIVATE_KEY;
const b64Auth = Buffer.from(PK + ":").toString('base64');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    let profilePicUrl = '';

    if (req.file) {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);
      formData.append("fileName", req.file.originalname);
      formData.append("folder", "/naukriquest-profiles");

      const ikRes = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${b64Auth}` },
        body: formData
      });
      const ikData = await ikRes.json();
      if (ikData.url) profilePicUrl = ikData.url;
    }

    const newUser = new User({ name, email, password, role, profilePic: profilePicUrl });
    await newUser.save();

    const { sendWelcomeEmail } = require('../services/emailService');
    setImmediate(() => {
      sendWelcomeEmail({ to: email, name, role }).catch((err) => {
        console.error('Welcome email trigger failed:', err.message);
      });
    });

    res.status(201).json({ message: 'User registered successfully', user: { email, role, name, profilePic: profilePicUrl } });
  } catch (error) {
    console.error('Registration failed', error);
    res.status(500).json({ error: 'Failed to register' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: { _id: user._id, email: user.email, role: user.role, name: user.name, profilePic: user.profilePic } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { register, login };
