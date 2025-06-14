/*
  # Create expenses tracking system

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key referencing auth.users.id)
      - `amount` (number) - transaction amount
      - `merchant` (text) - merchant/vendor name
      - `category` (text) - expense category
      - `timestamp` (timestamptz) - transaction date/time
      - `created_at` (timestamptz) - record creation time
      - `sms_text` (text, optional) - original SMS text for reference

  2. Security
    - Enable RLS on `expenses` table
    - Add policy for users to manage their own expenses only
    - Users can read, insert, update, and delete their own expense records

  3. Indexes
    - Index on user_id for fast user-specific queries
    - Index on timestamp for date-based filtering
    - Index on category for category-based analytics
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  merchant text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  sms_text text
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own expenses
CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_timestamp_idx ON expenses(timestamp DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_user_timestamp_idx ON expenses(user_id, timestamp DESC);