const express = require('express');
const connection = require('../model/user.model');
const jwtToken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Register Route
router.post('/register', async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    // 1. Validate input
    if (!full_name || !email || !password) {
      return res.status(400).json({ status: 400, message: 'All fields are required' });
    }

    // 2. Check if user already exists
    connection.query('SELECT * FROM userDetail WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ status: 500, message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ status: 400, message: 'Email already registered' });
      }

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Insert new user
      const insertQuery = 'INSERT INTO userDetail (full_name, email, password) VALUES (?, ?, ?)';
      connection.query(insertQuery, [full_name, email, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ status: 500, message: 'Error inserting user' });
        }

        res.status(201).json({
          status: 201,
          message: 'User created successfully',
          data: { id: result.insertId, full_name, email }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// Login Route
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 400, message: 'Email and password are required' });
    }

    // 1. Get user from MySQL by email
    connection.query('SELECT * FROM userDetail WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ status: 400, message: 'Invalid email or password' });
      }

      const user = results[0];

      // 2. Compare passwords
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ status: 401, message: 'Invalid email or password' });
      }

      // 3. Generate JWT
      const token = jwtToken.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

      // 4. Send response
      res.status(200).json({
        status: 200,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email
          }
        }
      });
    });
  }
  catch (err) {
    next(err);
  }

});

module.exports = router;