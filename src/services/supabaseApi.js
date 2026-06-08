import { supabase } from '../lib/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fail = (message) => ({ success: false, message });
const ok = (data) => ({ success: true, ...data });

const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
};

const formatProfile = (profile, authUser) => ({
  id: profile.id,
  email: profile.email || authUser?.email,
  name: profile.name || '',
  budget: Number(profile.budget) || 0,
  language: profile.language || 'en',
  theme: profile.theme || 'dark',
  avatar: profile.avatar || '🧑‍💻',
  photo: profile.photo || null,
  phone: profile.phone || null,
  isEmailVerified: profile.is_email_verified === true,
  isPhoneVerified: profile.is_phone_verified === true,
});

const mapExpense = (row) => ({
  id: row.id,
  userId: row.user_id,
  amount: Number(row.amount),
  category: row.category,
  description: row.description,
  date: row.date ? String(row.date).slice(0, 10) : row.date,
  source: row.source || 'manual',
  isHidden: row.is_hidden === true,
  createdAt: row.created_at,
});

const mapCategory = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  icon: row.icon,
  isCustom: row.is_custom === true,
  createdAt: row.created_at,
});

const mapNotification = (row) => ({
  id: row.id,
  title: row.title || (row.type === 'danger' ? 'Budget Alert' : row.type === 'warning' ? 'Budget Warning' : 'Update'),
  message: row.message,
  type: row.type || 'info',
  icon: row.icon || (row.type === 'danger' ? '🚨' : row.type === 'warning' ? '⚠️' : '💡'),
  time: row.created_at,
  createdAt: row.created_at,
  isRead: row.is_read === true,
  read: row.is_read === true,
});

const mapRecurring = (row) => ({
  id: row.id,
  userId: row.user_id,
  amount: Number(row.amount),
  category: row.category,
  description: row.description,
  frequency: row.frequency,
  startDate: row.start_date ? String(row.start_date).slice(0, 10) : row.start_date,
  nextDueDate: row.next_due_date ? String(row.next_due_date).slice(0, 10) : row.next_due_date,
  lastPaidDate: row.last_paid_date ? String(row.last_paid_date).slice(0, 10) : row.last_paid_date,
  isActive: row.is_active === true,
  createdAt: row.created_at,
});

const mapGoal = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  targetAmount: Number(row.target_amount),
  savedAmount: Number(row.saved_amount),
  category: row.category,
  icon: row.icon,
  deadline: row.deadline ? String(row.deadline).slice(0, 10) : row.deadline,
  isCompleted: row.is_completed === true,
  createdAt: row.created_at,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const emailExists = async (email) => {
  const { data, error } = await supabase.rpc('email_exists', { check_email: email });
  if (error) return null;
  return data === true;
};

/** Unblock sign-in when Supabase requires email confirmation before session */
const confirmEmailForAccess = async (email, userId = null) => {
  if (userId) {
    const { data, error } = await supabase.rpc('confirm_signup_user', { target_user_id: userId });
    if (!error && data === true) return true;
  }
  const { data, error } = await supabase.rpc('confirm_unverified_email', { check_email: email });
  if (error) {
    console.warn('confirm_unverified_email:', error.message);
    return false;
  }
  return data === true;
};

const isEmailNotConfirmedError = (error) =>
  (error?.message || '').toLowerCase().includes('email not confirmed');

const signInWithPassword = async (email, password, userId = null) => {
  let lastError = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session) {
      return { session: data.session, user: data.user, error: null };
    }

    lastError = error;
    if (!isEmailNotConfirmedError(error)) break;

    await confirmEmailForAccess(email, userId);
    await sleep(400);
  }

  return { session: null, user: null, error: lastError };
};

const ensureProfile = async (userId, email, name) => {
  const displayName = name || '';

  // Wait for the signup trigger to create the profile row
  for (let attempt = 0; attempt < 6; attempt++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    if (attempt < 5) await sleep(150 * (attempt + 1));
  }

  // Fallback when trigger is missing or delayed
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, name: displayName });
  if (upsertError) throw upsertError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    await sleep(200);
  }

  throw new Error('Profile could not be created. Please try signing in.');
};

const buildAuthUser = async (session, authUser, email, name) => {
  try {
    const profile = await ensureProfile(authUser.id, email, name || authUser.user_metadata?.name);
    return ok({
      token: session.access_token,
      user: formatProfile(profile, authUser),
    });
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('single json') || msg.includes('0 rows') || msg.includes('profile could not')) {
      return fail('Account created but profile setup failed. Please sign in to continue.');
    }
    return fail(err.message || 'Failed to complete registration.');
  }
};

const mapLoginError = async (email, error) => {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    const exists = await emailExists(email);
    if (exists === false) return fail('No account found with this email address.');
    if (exists === true) return fail('Incorrect password. Please try again.');
    return fail('Invalid email or password.');
  }
  if (msg.includes('email not confirmed')) {
    return fail('Unable to sign in yet. Please try again in a few seconds.');
  }
  if (msg.includes('too many requests')) return fail('Too many attempts. Please wait a moment and try again.');
  return fail(error.message || 'Login failed. Please try again.');
};

const mapRegisterError = (error) => {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
    return fail('This email is already registered. Try signing in instead.');
  }
  if (msg.includes('password')) return fail('Password must be at least 6 characters.');
  if (msg.includes('valid email')) return fail('Please enter a valid email address.');
  return fail(error.message || 'Registration failed. Please try again.');
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, message: 'No session' };
    try {
      const profile = await ensureProfile(
        session.user.id,
        session.user.email,
        session.user.user_metadata?.name
      );
      return ok({
        token: session.access_token,
        user: formatProfile(profile, session.user),
      });
    } catch {
      return fail('Profile not found');
    }
  },

  async login(email, password) {
    const { session, user, error } = await signInWithPassword(email, password);
    if (session && user) return buildAuthUser(session, user, email);
    return mapLoginError(email, error);
  },

  async register(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return mapRegisterError(error);

    if (data.session && data.user) {
      return buildAuthUser(data.session, data.user, email, name);
    }

    if (data.user) {
      await confirmEmailForAccess(email, data.user.id);

      const { session, user, error: signInError } = await signInWithPassword(email, password, data.user.id);
      if (session && user) return buildAuthUser(session, user, email, name);

      try {
        await ensureProfile(data.user.id, email, name);
      } catch {
        // Profile may still be created by the DB trigger
      }

      const signInMsg = (signInError?.message || '').toLowerCase();
      if (signInMsg.includes('email not confirmed')) {
        return fail('Account created! Please try signing in.');
      }
      return fail(signInError?.message || 'Account created but sign-in failed. Please try signing in.');
    }

    return fail('Registration failed. Please try again.');
  },

  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return fail('Invalid token');
    try {
      const profile = await ensureProfile(user.id, user.email, user.user_metadata?.name);
      return ok({ user: formatProfile(profile, user) });
    } catch (err) {
      return fail(err.message || 'Profile not found');
    }
  },

  async logout() {
    await supabase.auth.signOut();
    return ok({});
  },

  async sendOTP(type, value) {
    const userId = await getUserId();
    if (type === 'email') {
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { shouldCreateUser: false },
      });
      if (error) return fail(error.message);
      return ok({ message: 'OTP sent to your email' });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60000).toISOString();
    const { error } = await supabase.from('profiles').update({
      otp,
      otp_expires: expires,
      phone: value,
    }).eq('id', userId);
    if (error) return fail('Failed to send OTP');
    console.log(`[DEV] Phone OTP for ${value}: ${otp}`);
    return ok({ message: 'OTP sent to your phone' });
  },

  async verifyOTP(type, otp) {
    const userId = await getUserId();
    if (type === 'email') {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: 'email',
      });
      if (error) return fail('Invalid verification code');
      await supabase.from('profiles').update({ is_email_verified: true, otp: null, otp_expires: null }).eq('id', userId);
      return ok({ message: 'email verified successfully' });
    }
    const { data: profile } = await supabase.from('profiles').select('otp_expires').eq('id', userId).eq('otp', otp).single();
    if (!profile) return fail('Invalid verification code');
    if (new Date(profile.otp_expires) < new Date()) return fail('Code has expired');
    await supabase.from('profiles').update({
      is_phone_verified: true,
      otp: null,
      otp_expires: null,
    }).eq('id', userId);
    return ok({ message: 'phone verified successfully' });
  },

  async forgotPassword(identity) {
    if (!identity.includes('@')) return fail('Please enter a valid email address.');
    const exists = await emailExists(identity);
    if (exists === false) return fail('No account found with this email address.');
    const { error } = await supabase.auth.signInWithOtp({
      email: identity,
      options: { shouldCreateUser: false },
    });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('no user')) {
        return fail('No account found with this email address.');
      }
      return fail(error.message);
    }
    return ok({ message: 'Recovery code sent to your email.' });
  },

  async resetPassword(identity, otp, newPassword) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: identity,
      token: otp,
      type: 'email',
    });
    if (verifyError) return fail('Invalid recovery code');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return fail('Failed to reset password');
    await supabase.auth.signOut();
    return ok({ message: 'Password reset successful' });
  },

  async changePassword(oldPassword, newPassword) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (signInError) return fail('Incorrect old password');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return fail('Failed to change password');
    return ok({ message: 'Password changed successfully' });
  },
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenseApi = {
  async getAll() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) return fail('Server error');
    return ok({ expenses: (data || []).map(mapExpense) });
  },

  async add(exp) {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: exp.amount,
        category: exp.category,
        description: exp.description || '',
        date: exp.date,
        source: exp.source || 'manual',
      })
      .select()
      .single();
    if (error) return fail('Failed to save expense');
    return ok({ expense: mapExpense(data) });
  },

  async update(id, updates) {
    const userId = await getUserId();
    const { error } = await supabase
      .from('expenses')
      .update({
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        date: updates.date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return fail('Failed to update expense');
    return ok({});
  },

  async delete(id) {
    const userId = await getUserId();
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
    if (error) return fail('Failed to delete expense');
    return ok({});
  },

  async clearAll(type = null, month = null) {
    const userId = await getUserId();
    let query = supabase.from('expenses').update({ is_hidden: true }).eq('user_id', userId);
    const { data: all, error: fetchError } = await supabase
      .from('expenses')
      .select('id, description, date')
      .eq('user_id', userId);
    if (fetchError) return fail('Failed to update history');

    const idsToHide = (all || []).filter((e) => {
      const matchesType = !type ||
        (type === 'regular' && !e.description?.startsWith('Savings for: ') && !e.description?.startsWith('Bill Paid: ')) ||
        (type === 'goal' && e.description?.startsWith('Savings for: ')) ||
        (type === 'subscription' && e.description?.startsWith('Bill Paid: '));
      const matchesMonth = !month || (e.date && String(e.date).startsWith(month));
      return matchesType && matchesMonth;
    }).map((e) => e.id);

    if (idsToHide.length > 0) {
      const { error } = await supabase.from('expenses').update({ is_hidden: true }).in('id', idsToHide);
      if (error) return fail('Failed to update history');
    }
    return ok({});
  },
};

// ─── Budget ──────────────────────────────────────────────────────────────────

export const budgetApi = {
  async get() {
    const userId = await getUserId();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [profileRes, budgetRes, spentRes] = await Promise.all([
      supabase.from('profiles').select('budget').eq('id', userId).single(),
      supabase.from('budgets').select('amount').eq('user_id', userId).eq('month', month).eq('year', year).maybeSingle(),
      supabase.from('expenses').select('amount, date').eq('user_id', userId),
    ]);

    const defaultBudget = Number(profileRes.data?.budget) || 0;
    const budget = budgetRes.data ? Number(budgetRes.data.amount) : defaultBudget;
    const spent = (spentRes.data || [])
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((s, e) => s + Number(e.amount), 0);

    return ok({
      budget,
      defaultBudget,
      spent,
      remaining: budget - spent,
      month,
      year,
      percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    });
  },

  async set(amount) {
    const userId = await getUserId();
    const num = Number(amount);
    if (!num || num <= 0) return fail('Invalid amount');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { error } = await supabase.from('budgets').upsert(
      { user_id: userId, amount: num, month, year, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,month,year' }
    );
    if (error) return fail('Server error');
    return ok({ budget: num });
  },

  async getHistory() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('budgets')
      .select('month, year, amount')
      .eq('user_id', userId)
      .order('year')
      .order('month');
    if (error) return fail('Server error');
    const history = (data || []).map((r) => ({
      month: r.month,
      year: r.year,
      amount: Number(r.amount),
    }));
    return ok({
      totalBudget: history.reduce((s, r) => s + r.amount, 0),
      history,
    });
  },
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('Invalid token');
    try {
      const profile = await ensureProfile(user.id, user.email, user.user_metadata?.name);
      return ok({ user: formatProfile(profile, user) });
    } catch (err) {
      return fail(err.message || 'Profile not found');
    }
  },

  async update(updates) {
    const userId = await getUserId();
    const patch = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.language !== undefined) patch.language = updates.language;
    if (updates.theme !== undefined) patch.theme = updates.theme;
    if (updates.budget !== undefined) patch.budget = updates.budget;
    if (updates.avatar !== undefined) patch.avatar = updates.avatar;
    if (updates.photo !== undefined) patch.photo = updates.photo;
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();
    if (error) return fail('Failed to update profile');
    const { data: { user } } = await supabase.auth.getUser();
    return ok({ user: formatProfile(data, user) });
  },
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryApi = {
  async getAll() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('is_custom', { ascending: true })
      .order('name', { ascending: true });
    if (error) return fail('Server error');
    return ok({ categories: (data || []).map(mapCategory) });
  },

  async create(name, icon) {
    const userId = await getUserId();
    const trimmed = (name || '').trim();
    if (!trimmed) return fail('Category name is required');

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', trimmed)
      .maybeSingle();
    if (existing) return fail('You already have a category with this name');

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: trimmed, icon: icon || '📦', is_custom: true })
      .select()
      .single();
    if (error) return fail('Failed to create category');
    return ok({ category: mapCategory(data) });
  },
};

// ─── Notifications ─────────────────────────────────────────────────────────────

export const notificationApi = {
  async getAll() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return fail('Server error');
    return ok({ notifications: (data || []).map(mapNotification) });
  },

  async create(notif) {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: notif.message,
        type: notif.type || 'info',
        title: notif.title || '',
        icon: notif.icon || '',
      })
      .select()
      .single();
    if (error) return fail('Server error');
    return ok({ notification: mapNotification(data) });
  },

  async markRead() {
    const userId = await getUserId();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    return ok({});
  },

  async clear() {
    const userId = await getUserId();
    await supabase.from('notifications').delete().eq('user_id', userId);
    return ok({});
  },

  async delete(id) {
    const userId = await getUserId();
    await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId);
    return ok({});
  },
};

// ─── Recurring ───────────────────────────────────────────────────────────────

export const recurringApi = {
  async getAll() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('next_due_date');
    if (error) return fail('Server error');
    return ok({ recurring: (data || []).map(mapRecurring) });
  },

  async create(form) {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        user_id: userId,
        amount: form.amount,
        category: form.category,
        description: form.description || '',
        frequency: form.frequency,
        start_date: form.startDate,
        next_due_date: form.startDate,
      })
      .select()
      .single();
    if (error) return fail('Failed to create');
    return ok({ recurring: mapRecurring(data) });
  },

  async update(id, item) {
    const userId = await getUserId();
    const patch = {
      amount: item.amount,
      category: item.category,
      description: item.description || '',
      frequency: item.frequency,
      is_active: item.isActive !== undefined ? item.isActive : true,
      updated_at: new Date().toISOString(),
    };
    if (item.nextDueDate !== undefined) patch.next_due_date = item.nextDueDate;
    if (item.lastPaidDate !== undefined) patch.last_paid_date = item.lastPaidDate;

    const { error } = await supabase
      .from('recurring_expenses')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return fail('Failed to update');
    return ok({});
  },

  async delete(id) {
    const userId = await getUserId();
    await supabase.from('recurring_expenses').delete().eq('id', id).eq('user_id', userId);
    return ok({});
  },

  async processDue() {
    const userId = await getUserId();
    const today = new Date().toISOString().slice(0, 10);
    const { data: dueItems, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_due_date', today);
    if (error) return fail('Failed to process');

    let processed = 0;
    for (const item of dueItems || []) {
      await supabase.from('expenses').insert({
        user_id: userId,
        amount: item.amount,
        category: item.category,
        description: `[Recurring] ${item.description || ''}`,
        date: item.next_due_date,
      });

      const d = new Date(item.next_due_date);
      if (item.frequency === 'daily') d.setDate(d.getDate() + 1);
      else if (item.frequency === 'weekly') d.setDate(d.getDate() + 7);
      else if (item.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (item.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);

      await supabase.from('recurring_expenses').update({
        next_due_date: d.toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }).eq('id', item.id);

      processed++;
    }
    return ok({ processed });
  },
};

// ─── Goals ───────────────────────────────────────────────────────────────────

export const goalsApi = {
  async getAll() {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('is_completed')
      .order('deadline');
    if (error) return fail('Server error');
    return ok({ goals: (data || []).map(mapGoal) });
  },

  async create(form) {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        name: form.name,
        target_amount: form.targetAmount,
        category: form.category || 'Other',
        icon: form.icon || '🎯',
        deadline: form.deadline || null,
      })
      .select()
      .single();
    if (error) return fail('Failed to create goal');
    return ok({ goal: mapGoal(data) });
  },

  async addSavings(id, amount) {
    const userId = await getUserId();
    const { data: goal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fetchError || !goal) return fail('Goal not found');

    const newSaved = Math.max(0, Number(goal.saved_amount) + Number(amount));
    const isCompleted = newSaved >= Number(goal.target_amount);

    const { data, error } = await supabase
      .from('savings_goals')
      .update({
        saved_amount: newSaved,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return fail('Failed to update goal');
    return ok({ goal: mapGoal(data) });
  },

  async update(id, form) {
    const userId = await getUserId();
    const { error } = await supabase
      .from('savings_goals')
      .update({
        name: form.name,
        target_amount: form.targetAmount,
        category: form.category || 'Other',
        icon: form.icon || '🎯',
        deadline: form.deadline || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return fail('Failed to update goal');
    return ok({});
  },

  async delete(id) {
    const userId = await getUserId();
    await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId);
    return ok({});
  },
};
