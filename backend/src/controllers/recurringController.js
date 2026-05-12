import { getPool } from '../config/database.js';

// Get all recurring expenses for user
export const getRecurring = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', req.userId)
      .query('SELECT * FROM recurring_expenses WHERE userId = @userId ORDER BY nextDueDate ASC');
    res.json({ success: true, recurring: result.recordset });
  } catch (error) {
    console.error('Get recurring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create recurring expense
export const createRecurring = async (req, res) => {
  try {
    const pool = await getPool();
    const { amount, category, description, frequency, startDate } = req.body;
    if (!amount || !category || !frequency || !startDate) {
      return res.status(400).json({ success: false, message: 'Amount, category, frequency and start date are required' });
    }

    const result = await pool.request()
      .input('userId', req.userId)
      .input('amount', amount)
      .input('category', category)
      .input('description', description || '')
      .input('frequency', frequency)
      .input('startDate', startDate)
      .input('nextDueDate', startDate)
      .query(`
        INSERT INTO recurring_expenses (userId, amount, category, description, frequency, startDate, nextDueDate)
        OUTPUT INSERTED.*
        VALUES (@userId, @amount, @category, @description, @frequency, @startDate, @nextDueDate)
      `);

    res.json({ success: true, recurring: result.recordset[0] });
  } catch (error) {
    console.error('Create recurring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update recurring expense
export const updateRecurring = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { amount, category, description, frequency, isActive, nextDueDate, lastPaidDate } = req.body;

    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .input('amount', amount)
      .input('category', category)
      .input('description', description || '')
      .input('frequency', frequency)
      .input('isActive', isActive !== undefined ? isActive : 1)
      .input('nextDueDate', nextDueDate || null)
      .input('lastPaidDate', lastPaidDate || null)
      .query(`
        UPDATE recurring_expenses 
        SET amount = @amount, category = @category, description = @description, 
            frequency = @frequency, isActive = @isActive, 
            nextDueDate = COALESCE(@nextDueDate, nextDueDate),
            lastPaidDate = COALESCE(@lastPaidDate, lastPaidDate),
            updatedAt = GETDATE()
        WHERE id = @id AND userId = @userId
      `);

    res.json({ success: true });
  } catch (error) {
    console.error('Update recurring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete recurring expense
export const deleteRecurring = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('DELETE FROM recurring_expenses WHERE id = @id AND userId = @userId');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete recurring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Process due recurring expenses (auto-create expense entries)
export const processDueRecurring = async (req, res) => {
  try {
    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);

    const dueItems = await pool.request()
      .input('userId', req.userId)
      .input('today', today)
      .query(`
        SELECT * FROM recurring_expenses 
        WHERE userId = @userId AND isActive = 1 AND nextDueDate <= @today
      `);

    let processed = 0;
    for (const item of dueItems.recordset) {
      // Create expense entry
      await pool.request()
        .input('userId', req.userId)
        .input('amount', item.amount)
        .input('category', item.category)
        .input('description', `[Recurring] ${item.description}`)
        .input('date', item.nextDueDate)
        .query(`
          INSERT INTO expenses (userId, amount, category, description, date)
          VALUES (@userId, @amount, @category, @description, @date)
        `);

      // Calculate next due date
      let nextDate = new Date(item.nextDueDate);
      if (item.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (item.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (item.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (item.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      await pool.request()
        .input('id', item.id)
        .input('nextDueDate', nextDate.toISOString().slice(0, 10))
        .query('UPDATE recurring_expenses SET nextDueDate = @nextDueDate, updatedAt = GETDATE() WHERE id = @id');

      processed++;
    }

    res.json({ success: true, processed });
  } catch (error) {
    console.error('Process recurring error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
