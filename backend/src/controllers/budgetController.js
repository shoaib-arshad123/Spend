import { pool } from '../config/database.js';

export const setBudget = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    await pool.request()
      .input('amount', amount)
      .input('userId', req.userId)
      .query('UPDATE users SET budget = @amount WHERE id = @userId');

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const checkResult = await pool.request()
      .input('userId', req.userId)
      .input('month', month)
      .input('year', year)
      .query('SELECT id FROM budgets WHERE userId = @userId AND month = @month AND year = @year');

    if (checkResult.recordset.length > 0) {
      await pool.request()
        .input('amount', amount)
        .input('userId', req.userId)
        .input('month', month)
        .input('year', year)
        .query('UPDATE budgets SET amount = @amount WHERE userId = @userId AND month = @month AND year = @year');
    } else {
      await pool.request()
        .input('userId', req.userId)
        .input('amount', amount)
        .input('month', month)
        .input('year', year)
        .query('INSERT INTO budgets (userId, amount, month, year) VALUES (@userId, @amount, @month, @year)');
    }

    res.json({ success: true, message: 'Budget set successfully', budget: amount });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBudget = async (req, res) => {
  try {
    const userResult = await pool.request()
      .input('userId', req.userId)
      .query('SELECT budget FROM users WHERE id = @userId');

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const totalSpendingResult = await pool.request()
      .input('userId', req.userId)
      .input('month', month)
      .input('year', year)
      .query('SELECT SUM(amount) as total FROM expenses WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year');

    const budget = userResult.recordset[0]?.budget || 0;
    const spent = totalSpendingResult.recordset[0]?.total || 0;
    const remaining = budget - spent;

    res.json({
      success: true,
      budget,
      spent,
      remaining,
      percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
