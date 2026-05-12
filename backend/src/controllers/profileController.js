import { getPool } from '../config/database.js';

export const getProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', req.userId)
      .query('SELECT id, name, email, budget, language, theme, avatar, photo, createdAt FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.recordset[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const { name, language, theme, budget, avatar, photo } = req.body;
    const request = pool.request().input('id', req.userId);

    const updateFields = [];
    if (name !== undefined) { updateFields.push('name = @name'); request.input('name', name); }
    if (language !== undefined) { updateFields.push('language = @language'); request.input('language', language); }
    if (theme !== undefined) { updateFields.push('theme = @theme'); request.input('theme', theme); }
    if (budget !== undefined) { updateFields.push('budget = @budget'); request.input('budget', budget); }
    if (avatar !== undefined) { updateFields.push('avatar = @avatar'); request.input('avatar', avatar); }
    if (photo !== undefined) { updateFields.push('photo = @photo'); request.input('photo', photo); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    await request.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = @id`);

    const result = await pool.request()
      .input('id', req.userId)
      .query('SELECT id, name, email, budget, language, theme, avatar, photo FROM users WHERE id = @id');

    res.json({ success: true, message: 'Profile updated successfully', user: result.recordset[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
