import { pool } from '../config/database.js';

export const addExpense = async (req, res) => {
  try {
    const { amount, category, description, date, source } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const result = await pool.request()
      .input('userId', req.userId)
      .input('amount', amount)
      .input('category', category)
      .input('description', description || '')
      .input('date', date)
      .input('source', source || 'manual')
      .query('INSERT INTO expenses (userId, amount, category, description, date, source) OUTPUT INSERTED.id VALUES (@userId, @amount, @category, @description, @date, @source)');

    const expenseId = result.recordset[0].id;

    if (amount >= 5000) {
      await pool.request()
        .input('userId', req.userId)
        .input('message', `You added a large expense of PKR ${amount} for ${category}. Keep an eye on your budget!`)
        .input('type', 'warning')
        .query('INSERT INTO notifications (userId, message, type) VALUES (@userId, @message, @type)');
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: { id: expenseId, userId: req.userId, amount, category, description, date, source: source || 'manual' }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 50 } = req.query;
    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;

    const request = pool.request().input('userId', req.userId);

    let baseQuery = 'WHERE userId = @userId';

    if (startDate && endDate) {
      baseQuery += ' AND date BETWEEN @startDate AND @endDate';
      request.input('startDate', startDate);
      request.input('endDate', endDate);
    }

    if (category && category !== 'all') {
      baseQuery += ' AND category = @category';
      request.input('category', category);
    }

    // Get total count for pagination metadata
    const countResult = await request.query(`SELECT COUNT(*) as total FROM expenses ${baseQuery}`);
    const totalCount = countResult.recordset[0].total;

    // Get paginated results
    const query = `
      SELECT * FROM expenses 
      ${baseQuery} 
      ORDER BY date DESC 
      OFFSET ${offset} ROWS 
      FETCH NEXT ${l} ROWS ONLY
    `;

    const result = await request.query(query);
    
    res.json({ 
      success: true, 
      expenses: result.recordset,
      pagination: {
        total: totalCount,
        page: p,
        limit: l,
        totalPages: Math.ceil(totalCount / l)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('SELECT id FROM expenses WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('DELETE FROM expenses WHERE id = @id AND userId = @userId');

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const checkResult = await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('SELECT id FROM expenses WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await pool.request()
      .input('id', id)
      .input('amount', amount)
      .input('category', category)
      .input('description', description)
      .input('date', date)
      .query('UPDATE expenses SET amount = @amount, category = @category, description = @description, date = @date WHERE id = @id');

    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getExpenseStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
    const queryYear = parseInt(year) || currentDate.getFullYear();

    const totalResult = await pool.request()
      .input('userId', req.userId)
      .input('month', queryMonth)
      .input('year', queryYear)
      .query('SELECT SUM(amount) as total FROM expenses WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year');

    const categoryResult = await pool.request()
      .input('userId', req.userId)
      .input('month', queryMonth)
      .input('year', queryYear)
      .query('SELECT category, SUM(amount) as amount, COUNT(*) as count FROM expenses WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year GROUP BY category');

    const dailyResult = await pool.request()
      .input('userId', req.userId)
      .input('month', queryMonth)
      .input('year', queryYear)
      .query('SELECT CAST(date as DATE) as date, SUM(amount) as amount FROM expenses WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year GROUP BY CAST(date as DATE) ORDER BY date DESC');

    res.json({
      success: true,
      stats: {
        total: totalResult.recordset[0]?.total || 0,
        byCategory: categoryResult.recordset,
        daily: dailyResult.recordset
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
