import { pool } from '../config/database.js';

// Get all savings goals for user
export const getGoals = async (req, res) => {
  try {
    const result = await pool.request()
      .input('userId', req.userId)
      .query('SELECT * FROM savings_goals WHERE userId = @userId ORDER BY isCompleted ASC, deadline ASC');
    res.json({ success: true, goals: result.recordset });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create savings goal
export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, category, icon, deadline } = req.body;
    if (!name || !targetAmount) {
      return res.status(400).json({ success: false, message: 'Name and target amount are required' });
    }

    const result = await pool.request()
      .input('userId', req.userId)
      .input('name', name)
      .input('targetAmount', targetAmount)
      .input('category', category || 'Other')
      .input('icon', icon || '🎯')
      .input('deadline', deadline || null)
      .query(`
        INSERT INTO savings_goals (userId, name, targetAmount, category, icon, deadline)
        OUTPUT INSERTED.*
        VALUES (@userId, @name, @targetAmount, @category, @icon, @deadline)
      `);

    res.json({ success: true, goal: result.recordset[0] });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add savings to a goal
export const addSavings = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount === 0) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const result = await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .input('amount', amount)
      .query(`
        UPDATE savings_goals 
        SET savedAmount = CASE WHEN savedAmount + @amount < 0 THEN 0 ELSE savedAmount + @amount END, 
            isCompleted = CASE WHEN savedAmount + @amount >= targetAmount THEN 1 ELSE 0 END,
            updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND userId = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({ success: true, goal: result.recordset[0] });
  } catch (error) {
    console.error('Add savings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update savings goal
export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, category, icon, deadline } = req.body;

    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .input('name', name)
      .input('targetAmount', targetAmount)
      .input('category', category || 'Other')
      .input('icon', icon || '🎯')
      .input('deadline', deadline || null)
      .query(`
        UPDATE savings_goals 
        SET name = @name, targetAmount = @targetAmount, category = @category, 
            icon = @icon, deadline = @deadline, updatedAt = GETDATE()
        WHERE id = @id AND userId = @userId
      `);

    res.json({ success: true });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete savings goal
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('DELETE FROM savings_goals WHERE id = @id AND userId = @userId');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
