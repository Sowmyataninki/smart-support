import { db } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = hashPassword(password);

    const newUser = await db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = crypto.randomBytes(32).toString('hex');

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      const hashedPassword = hashPassword(password);
      user = await db.users.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword
      });
    } else {
      const isPasswordValid = verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
};
