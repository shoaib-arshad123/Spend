import { getPool } from '../config/database.js';

export const setBudget = async (req, res) => {
  try {
    const pool = await getPool();
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;  // 1-12
    const year = currentDate.getFullYear();

    // Validate month and year are correct
    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid date calculation' });
    }

    // Check if budget already exists for this EXACT month and year
    const checkResult = await pool.request()
      .input('userId', req.userId)
      .input('month', month)
      .input('year', year)
      .query('SELECT id FROM budgets WHERE userId = @userId AND month = @month AND year = @year');

    if (checkResult.recordset.length > 0) {
      // Update ONLY the current month/year for this user - critical: must include month and year in WHERE clause
      const updateQuery = `UPDATE budgets 
        SET amount = @amount 
        WHERE userId = @userId 
        AND month = @month 
        AND year = @year`;
      
      const result = await pool.request()
        .input('userId', req.userId)
        .input('month', month)
        .input('year', year)
        .input('amount', amount)
        .query(updateQuery);
      
      // Verify exactly ONE row was updated
      if (result.rowsAffected[0] !== 1) {
        console.warn(`Warning: Updated ${result.rowsAffected[0]} rows instead of 1 for userId ${req.userId}, month ${month}, year ${year}`);
      }
    } else {
      // Insert new budget entry for current month/year only
      const insertQuery = `INSERT INTO budgets (userId, amount, month, year) 
        VALUES (@userId, @amount, @month, @year)`;
      
      await pool.request()
        .input('userId', req.userId)
        .input('amount', amount)
        .input('month', month)
        .input('year', year)
        .query(insertQuery);
    }

    res.json({ success: true, message: 'Budget set successfully', budget: amount });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBudget = async (req, res) => {
  try {
    const pool = await getPool();
    const userResult = await pool.request()
      .input('userId', req.userId)
      .query('SELECT budget FROM users WHERE id = @userId');

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const budgetRow = await pool.request()
      .input('userId', req.userId)
      .input('month', month)
      .input('year', year)
      .query('SELECT amount, updatedAt FROM budgets WHERE userId = @userId AND month = @month AND year = @year');

    const totalSpendingResult = await pool.request()
      .input('userId', req.userId)
      .input('month', month)
      .input('year', year)
      .query('SELECT SUM(amount) as total FROM expenses WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year');

    const defaultBudget = userResult.recordset[0]?.budget || 0;
    const budget = budgetRow.recordset[0]?.amount ?? defaultBudget;
    const spent = totalSpendingResult.recordset[0]?.total || 0;
    const remaining = budget - spent;

    res.json({
      success: true,
      budget,
      defaultBudget,
      spent,
      remaining,
      month,
      year,
      percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBudgetHistory = async (req, res) => {
  try {
    const pool = await getPool();
    const historyResult = await pool.request()
      .input('userId', req.userId)
      .query('SELECT month, year, amount FROM budgets WHERE userId = @userId ORDER BY year, month');

    const totalBudget = historyResult.recordset.reduce((sum, row) => sum + (row.amount || 0), 0);

    res.json({
      success: true,
      totalBudget,
      history: historyResult.recordset
    });
  } catch (error) {
    console.error('Get budget history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
