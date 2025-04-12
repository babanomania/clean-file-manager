-- Create a function to verify share passwords
CREATE OR REPLACE FUNCTION public.verify_share_password(share_id TEXT, password_attempt TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
  is_protected BOOLEAN;
BEGIN
  -- Get the password hash and protection status
  SELECT 
    password_hash, 
    is_password_protected 
  INTO 
    stored_hash, 
    is_protected
  FROM 
    public.shares
  WHERE 
    id = share_id;
  
  -- If share doesn't exist, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If not password protected, return true
  IF NOT is_protected THEN
    RETURN TRUE;
  END IF;
  
  -- In a real app, you would use a proper password comparison
  -- For now, we're just doing a simple string comparison
  -- This should be replaced with a secure password verification method
  RETURN stored_hash = password_attempt;
END;
$$;
