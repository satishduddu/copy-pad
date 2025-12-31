/*
  # Add Atomic View Decrement Function

  ## Overview
  This migration creates a PostgreSQL function to atomically decrement the remaining_views
  count for a paste. This ensures thread-safe view counting under concurrent access.

  ## New Functions
  
  ### `decrement_paste_views(paste_id text)`
  - Atomically decrements remaining_views by 1
  - Never goes below 0
  - Returns the new remaining_views value
  - Only decrements if remaining_views > 0
  - Uses SECURITY DEFINER to bypass RLS

  ## Security
  - Function is SECURITY DEFINER to allow updates through RLS
  - Only performs safe, bounded operations (decrement with lower bound)

  ## Important Notes
  1. This function is called by the fetch-paste edge function
  2. Ensures no race conditions when multiple users fetch the same paste simultaneously
  3. The GREATEST function ensures views never go negative
*/

CREATE OR REPLACE FUNCTION decrement_paste_views(paste_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_remaining integer;
BEGIN
  UPDATE pastes
  SET remaining_views = GREATEST(remaining_views - 1, 0)
  WHERE id = paste_id AND remaining_views > 0
  RETURNING remaining_views INTO new_remaining;
  RETURN new_remaining;
END;
$$;