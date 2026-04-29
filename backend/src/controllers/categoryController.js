import { pool } from '../config/database.js';

export const getCategories = async (req, res) => {
  try {
    const request = pool.request();

    let query;
    if (req.userId) {
      request.input('userId', req.userId);
      query = 'SELECT * FROM categories WHERE userId IS NULL OR userId = @userId ORDER BY isCustom ASC, name ASC';
    } else {
      query = 'SELECT * FROM categories WHERE userId IS NULL ORDER BY name ASC';
    }

    const result = await request.query(query);
    res.json({ success: true, categories: result.recordset });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Check if category already exists for this user
    const existing = await pool.request()
      .input('userId', userId)
      .input('name', name.trim())
      .query('SELECT id FROM categories WHERE userId = @userId AND name = @name');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a category with this name' });
    }

    const result = await pool.request()
      .input('userId', userId)
      .input('name', name.trim())
      .input('icon', icon || '📦')
      .query('INSERT INTO categories (userId, name, icon, isCustom) OUTPUT INSERTED.id VALUES (@userId, @name, @icon, 1)');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: result.recordset[0].id,
        userId,
        name: name.trim(),
        icon: icon || '📦',
        isCustom: 1,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
