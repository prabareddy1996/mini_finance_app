// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`[SIGNUP ATTEMPT] Name: ${name}, Email: ${email}`);

  try {
    let user = await User.findOne({ email });
    if (user) {
      console.warn(`[SIGNUP FAILED] User already exists with email: ${email}`);
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);
    console.log(`[SIGNUP SUCCESS] User created: ${user.name} (${user.email})`);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(`[SIGNUP ERROR] ${err.message}`);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] Identifier: ${email}`);

  try {
    const user = await User.findOne({
      $or: [{ email: email }, { name: email }],
    });

    if (!user) {
      console.warn(`[LOGIN FAILED] No user found with identifier: ${email}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.warn(`[LOGIN FAILED] Incorrect password for: ${user.email}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log(`[LOGIN SUCCESS] User: ${user.name} (${user.email})`);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(`[LOGIN ERROR] ${err.message}`);
    res.status(500).json({ msg: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(`[RESET ATTEMPT] Email: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[RESET FAILED] No user found with email: ${email}`);
      return res.status(400).json({ msg: "User not found" });
    }

    user.password = newPassword;
    await user.save();
    console.log(`[RESET SUCCESS] Password changed for: ${user.email}`);
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(`[RESET ERROR] ${err.message}`);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;