import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import nodemailer from 'nodemailer';

// ─── EMAIL TRANSPORTER ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRealEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
    console.log(`[AUTH-MOCK] Skipping real email to ${to} (Config missing)`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    console.log(`[AUTH] Real email sent to ${to}`);
  } catch (err) {
    console.error('[AUTH] Email send failed:', err);
  }
};

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    // Check if email exists
    console.log(`[REGISTER] Checking email: ${email}`);
    const checkRequest = pool.request().input('email', email);
    const checkResult = await checkRequest.query('SELECT id FROM users WHERE email = @email');
    console.log(`[REGISTER] Found ${checkResult.recordset.length} users with this email`);
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('email', email)
      .input('password', hashed)
      .input('name', name || '')
      .query(`
        INSERT INTO users (email, password, name)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.avatar, INSERTED.photo
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
    if (!user) return res.status(401).json({ success: false, message: 'invalid candidate' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'password error' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '🧑‍💻',
        photo: user.photo || null,
        phone: user.phone || null,
        isEmailVerified: user.isEmailVerified === true || user.isEmailVerified === 1,
        isPhoneVerified: user.isPhoneVerified === true || user.isPhoneVerified === 1
      }
    });
  } catch (err) {
    console.error('LOGIN ERROR', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  const request = pool.request().input('id', req.userId);
  try {
    const result = await request.query('SELECT id, email, name, budget, avatar, photo, phone, isEmailVerified, isPhoneVerified FROM users WHERE id = @id');
    const user = result.recordset[0];
    if (user) {
      user.isEmailVerified = user.isEmailVerified === true || user.isEmailVerified === 1;
      user.isPhoneVerified = user.isPhoneVerified === true || user.isPhoneVerified === 1;
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('GET CURRENT USER', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- SECURITY & VERIFICATION ---

export const sendOTP = async (req, res) => {
  const { type, value } = req.body; // type: 'email' | 'phone', value: the actual email or phone
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60000); // 10 mins

  try {
    const updateQuery = type === 'phone' 
      ? 'UPDATE users SET otp = @otp, otpExpires = @expires, phone = @val WHERE id = @id'
      : 'UPDATE users SET otp = @otp, otpExpires = @expires WHERE id = @id';

    await pool.request()
      .input('id', req.userId)
      .input('otp', otp)
      .input('expires', expires)
      .input('val', value)
      .query(updateQuery);

    console.log(`[AUTH] OTP for ${value}: ${otp}`);
    if (type === 'email') {
      await sendRealEmail(value, 'SpendSmart Verification Code', `Your verification code is: ${otp}. It will expire in 10 minutes.`);
    }

    res.json({ success: true, message: `OTP sent to your ${type}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  const { type, otp } = req.body;
  try {
    const result = await pool.request()
      .input('id', req.userId)
      .input('otp', otp)
      .input('now', new Date())
      .query('SELECT otpExpires FROM users WHERE id = @id AND otp = @otp');
    
    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    if (result.recordset[0].otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Code has expired' });
    }

    await pool.request()
      .input('id', req.userId)
      .query(`UPDATE users SET ${type === 'email' ? 'isEmailVerified = 1' : 'isPhoneVerified = 1'}, otp = NULL, otpExpires = NULL WHERE id = @id`);

    res.json({ success: true, message: `${type} verified successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const forgotPassword = async (req, res) => {
  const { identity } = req.body; // email or phone
  try {
    const result = await pool.request()
      .input('ident', identity)
      .query('SELECT id, email, phone FROM users WHERE email = @ident OR phone = @ident');
    
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ success: false, message: 'Wrong email address' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000);

    await pool.request()
      .input('id', user.id)
      .input('otp', otp)
      .input('expires', expires)
      .query('UPDATE users SET otp = @otp, otpExpires = @expires WHERE id = @id');

    console.log(`[AUTH-FORGOT] OTP for ${identity}: ${otp}`);
    if (identity.includes('@')) {
      await sendRealEmail(identity, 'SpendSmart Password Recovery', `Your password recovery code is: ${otp}. It will expire in 10 minutes.`);
    }

    res.json({ success: true, message: 'Recovery OTP sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { identity, otp, newPassword } = req.body;
  try {
    const result = await pool.request()
      .input('ident', identity)
      .input('otp', otp)
      .query('SELECT id, otpExpires FROM users WHERE (email = @ident OR phone = @ident) AND otp = @otp');
    
    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid recovery code' });
    }
    if (result.recordset[0].otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Recovery code has expired' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', result.recordset[0].id)
      .input('pass', hashed)
      .query('UPDATE users SET password = @pass, otp = NULL, otpExpires = NULL WHERE id = @id');

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await pool.request().input('id', req.userId).query('SELECT password FROM users WHERE id = @id');
    const user = result.recordset[0];
    
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      console.log(`[AUTH] Password mismatch for user ${req.userId}`);
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request().input('id', req.userId).input('pass', hashed).query('UPDATE users SET password = @pass WHERE id = @id');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
