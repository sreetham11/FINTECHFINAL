-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overseas_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is a member of a group
CREATE OR REPLACE FUNCTION is_group_member(group_id_param text, user_id_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users policies
CREATE POLICY "Allow read access to all profiles for authenticated users" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to update only their own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- 2. Groups policies
CREATE POLICY "Allow group access for members" 
ON groups FOR SELECT 
TO authenticated 
USING (is_group_member(id, auth.uid()::text));

CREATE POLICY "Allow group creation/update for members or creators" 
ON groups FOR ALL 
TO authenticated 
USING (auth.uid()::text = created_by OR is_group_member(id, auth.uid()::text));

-- 3. Group Members policies
CREATE POLICY "Allow read group members" 
ON group_members FOR SELECT 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text));

CREATE POLICY "Allow join/modify group members" 
ON group_members FOR ALL 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text) OR auth.uid()::text = user_id);

-- 4. Expenses policies
CREATE POLICY "Allow read expenses for group members" 
ON expenses FOR SELECT 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text));

CREATE POLICY "Allow create/modify expenses for group members" 
ON expenses FOR ALL 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text));

-- 5. Expense Splits policies
CREATE POLICY "Allow read splits for group members" 
ON expense_splits FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM expenses 
    WHERE expenses.id = expense_splits.expense_id 
    AND is_group_member(expenses.group_id, auth.uid()::text)
  )
);

CREATE POLICY "Allow create/modify splits for group members" 
ON expense_splits FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM expenses 
    WHERE expenses.id = expense_splits.expense_id 
    AND is_group_member(expenses.group_id, auth.uid()::text)
  )
);

-- 6. Settlements policies
CREATE POLICY "Allow read settlements for group members" 
ON settlements FOR SELECT 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text));

CREATE POLICY "Allow write settlements for group members" 
ON settlements FOR ALL 
TO authenticated 
USING (is_group_member(group_id, auth.uid()::text));

-- 7. Mood Check-ins policies
CREATE POLICY "Allow read/write own mood checkins" 
ON mood_checkins FOR ALL 
TO authenticated 
USING (auth.uid()::text = user_id);

-- 8. Transactions policies
CREATE POLICY "Allow read/write own transactions" 
ON transactions FOR ALL 
TO authenticated 
USING (auth.uid()::text = user_id);

-- 9. Overseas Sessions policies
CREATE POLICY "Allow read/write own overseas sessions" 
ON overseas_sessions FOR ALL 
TO authenticated 
USING (auth.uid()::text = user_id);

-- 10. Expense Notes policies
CREATE POLICY "Allow read notes for group members" 
ON expense_notes FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM expenses 
    WHERE expenses.id = expense_notes.expense_id 
    AND is_group_member(expenses.group_id, auth.uid()::text)
  )
);

CREATE POLICY "Allow create/modify notes for group members" 
ON expense_notes FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM expenses 
    WHERE expenses.id = expense_notes.expense_id 
    AND is_group_member(expenses.group_id, auth.uid()::text)
  )
);
