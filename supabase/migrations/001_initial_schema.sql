-- =============================================================================
-- SpendSmart — Supabase (PostgreSQL) Schema
-- Converted from MSSQL: schema_mssql.sql + setup_notifications.sql
--                      + setup_recurring_goals.sql + schema_update.sql
-- =============================================================================
-- MSSQL `users`          → auth.users (email/password) + public.profiles
-- MSSQL `userId` (INT)   → user_id (UUID → profiles.id)
-- MSSQL camelCase cols   → snake_case (PostgreSQL convention)
-- =============================================================================

-- ─── PROFILES  (MSSQL: users) ─────────────────────────────────────────────────
-- auth.users handles: email, password (encrypted)
-- profiles handles: name, budget, language, theme, avatar, photo, etc.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  budget        DECIMAL(10, 2) DEFAULT 0,
  language      VARCHAR(20) DEFAULT 'en',
  theme         VARCHAR(20) DEFAULT 'dark',
  avatar        TEXT DEFAULT '🧑‍💻',          -- schema_update.sql
  photo         TEXT,                          -- schema_update.sql (base64)
  phone         TEXT,                            -- used by auth OTP flow
  otp           TEXT,
  otp_expires   TIMESTAMPTZ,                     -- MSSQL: otpExpires
  is_email_verified BOOLEAN DEFAULT FALSE,       -- MSSQL: isEmailVerified
  is_phone_verified BOOLEAN DEFAULT FALSE,       -- MSSQL: isPhoneVerified
  badges        JSONB DEFAULT '[]'::jsonb,       -- db-setup.js (MSSQL: NVARCHAR MAX)
  created_at    TIMESTAMPTZ DEFAULT NOW(),       -- MSSQL: createdAt
  updated_at    TIMESTAMPTZ DEFAULT NOW()        -- MSSQL: updatedAt
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ─── CATEGORIES  (MSSQL: categories) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- NULL = system default
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(100),
  is_custom  BOOLEAN DEFAULT FALSE,            -- MSSQL: isCustom BIT
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_id_name
  ON public.categories(user_id, name) WHERE user_id IS NOT NULL;

-- ─── EXPENSES  (MSSQL: expenses) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      DECIMAL(10, 2) NOT NULL,
  category    VARCHAR(100),
  description TEXT,
  date        DATE NOT NULL,
  source      VARCHAR(50) DEFAULT 'manual',    -- manual | voice | scanner
  is_hidden   BOOLEAN DEFAULT FALSE,           -- MSSQL: isHidden (migrate_hidden.js)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_date ON public.expenses(user_id, date);

-- ─── BUDGETS  (MSSQL: budgets) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     DECIMAL(10, 2) NOT NULL,
  month      INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- ─── NOTIFICATIONS  (MSSQL: notifications + setup_notifications.sql) ─────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    VARCHAR(500) NOT NULL,
  type       VARCHAR(50) DEFAULT 'info',
  title      VARCHAR(255),                     -- setup_notifications.sql
  icon       VARCHAR(50),                      -- setup_notifications.sql
  is_read    BOOLEAN DEFAULT FALSE,            -- MSSQL: isRead BIT
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ─── REWARDS  (MSSQL: rewards) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rewards (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      INT DEFAULT 0,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON public.rewards(user_id);

-- ─── RECURRING EXPENSES  (MSSQL: recurring_expenses + setup_recurring_goals.sql)
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         DECIMAL(10, 2) NOT NULL,
  category       VARCHAR(100) NOT NULL,
  description    VARCHAR(500),
  frequency      VARCHAR(20) NOT NULL DEFAULT 'monthly',  -- daily|weekly|monthly|yearly
  start_date     DATE NOT NULL,                            -- MSSQL: startDate
  next_due_date  DATE NOT NULL,                            -- MSSQL: nextDueDate
  last_paid_date DATE,                                     -- used by app for bill tracking
  is_active      BOOLEAN DEFAULT TRUE,                     -- MSSQL: isActive BIT
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON public.recurring_expenses(next_due_date);

-- ─── SAVINGS GOALS  (MSSQL: savings_goals + setup_recurring_goals.sql) ────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  target_amount  DECIMAL(10, 2) NOT NULL,        -- MSSQL: targetAmount
  saved_amount   DECIMAL(10, 2) DEFAULT 0,       -- MSSQL: savedAmount
  category       VARCHAR(100) DEFAULT 'Other',   -- Emergency Fund, Travel, etc.
  icon           TEXT DEFAULT '🎯',
  deadline       DATE,
  is_completed   BOOLEAN DEFAULT FALSE,          -- MSSQL: isCompleted BIT
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.savings_goals(user_id);

-- ─── DEFAULT CATEGORIES  (MSSQL: INSERT in schema_mssql.sql) ──────────────────
INSERT INTO public.categories (user_id, name, icon, is_custom)
SELECT NULL, v.name, v.icon, FALSE
FROM (VALUES
  ('Food & Dining',      '🍔'),
  ('Transportation',     '🚗'),
  ('Entertainment',      '🎬'),
  ('Shopping',           '🛍️'),
  ('Bills & Utilities',  '💡'),
  ('Health & Fitness',   '⚕️'),
  ('Education',          '📚'),
  ('Travel',             '✈️'),
  ('Other',              '📌')
) AS v(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id IS NULL AND c.name = v.name
);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, email, name, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- categories (system defaults + own)
CREATE POLICY "categories_select" ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "categories_insert" ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update" ON public.categories FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "categories_delete" ON public.categories FOR DELETE
  USING (user_id = auth.uid());

-- expenses
CREATE POLICY "expenses_all" ON public.expenses FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- budgets
CREATE POLICY "budgets_all" ON public.budgets FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notifications
CREATE POLICY "notifications_all" ON public.notifications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- rewards
CREATE POLICY "rewards_all" ON public.rewards FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- recurring_expenses
CREATE POLICY "recurring_all" ON public.recurring_expenses FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- savings_goals
CREATE POLICY "goals_all" ON public.savings_goals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
