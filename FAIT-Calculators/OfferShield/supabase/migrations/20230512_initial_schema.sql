-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  job_type TEXT,
  zip_code TEXT,
  budget NUMERIC,
  confidence_score INTEGER,
  results JSONB,
  is_paid BOOLEAN DEFAULT FALSE
);

-- Create RLS policies
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analyses
CREATE POLICY "Users can view their own analyses"
  ON analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses"
  ON analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update their own analyses"
  ON analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete their own analyses"
  ON analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to check if user has free analysis available
CREATE OR REPLACE FUNCTION public.user_has_free_analysis_available(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  analysis_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO analysis_count
  FROM analyses
  WHERE analyses.user_id = user_has_free_analysis_available.user_id;
  
  RETURN analysis_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
