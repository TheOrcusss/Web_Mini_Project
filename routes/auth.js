const express = require('express');
const User = require('../models/User');
const router = express.Router();

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('📥 Received signup data:', req.body);
  try {
    const user = await User.findOne({ username });

    if (!user) {
      console.log('❌ User not found');
      return res.redirect('/public/login.html');
    }

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      req.session.userId = user._id;
      console.log('✅ Login successful');
      return res.redirect('/public/landing.html');
    } else {
      console.log('❌ Incorrect password');
      return res.redirect('/public/login.html');
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    res.redirect('/public/login.html');
  }
});

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email, password }); // No need to hash manually
    await newUser.save();

    console.log('✅ User registered:', newUser.username);
    res.redirect('/public/login.html');
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.redirect('/public/login.html');
  }
});

module.exports = router;