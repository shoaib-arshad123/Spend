// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  const hashed = await bcrypt.hash(password, 10);
  const request = pool.request()
    .input('email', email)
    .input('password', hashed)
    .input('name', name || '');

  try {
    const result = await request.query(`
      INSERT INTO users (email, password, name)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.name
      VALUES (@email, @password, @name)
    `);
    const user = result.recordset[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('REGISTER ERROR', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  const request = pool.request().input('email', email);
  try {
    const result = await request.query('SELECT * FROM users WHERE email = @email');
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('LOGIN ERROR', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  const request = pool.request().input('id', req.userId);
  try {
    const result = await request.query('SELECT id, email, name, budget FROM users WHERE id = @id');
    const user = result.recordset[0];
    res.json({ success: true, user });
  } catch (err) {
    console.error('GET CURRENT USER', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
