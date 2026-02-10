-- 1. Create the table to store user data (Document Store pattern)
-- This table stores the entire application state for a user in a single JSONB column.
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INT4 NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
-- This is crucial to ensure users can only access their own data.
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy
-- Allow users to perform ALL actions (SELECT, INSERT, UPDATE, DELETE) 
-- only on rows where the user_id matches their authenticated ID.
CREATE POLICY "Users can perform all actions on their own data"
ON public.user_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
