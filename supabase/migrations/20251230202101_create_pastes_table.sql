/*
  # Create Pastes Table for Pastebin-Lite

  ## Overview
  This migration creates the core pastes table that stores user-submitted text snippets
  with optional expiration constraints (time-based and view-based).

  ## New Tables
  
  ### `pastes`
  - `id` (text, primary key) - Unique identifier for the paste (e.g., nanoid)
  - `content` (text, required) - The actual paste content
  - `ttl_seconds` (integer, nullable) - Original TTL constraint in seconds
  - `max_views` (integer, nullable) - Original max view constraint
  - `remaining_views` (integer, nullable) - Current remaining views (null = unlimited)
  - `created_at` (timestamptz) - When the paste was created
  - `expires_at` (timestamptz, nullable) - Calculated expiration time (null = no TTL)

  ## Security
  - Enable RLS on `pastes` table
  - Public read access for fetching pastes by ID
  - Public insert access for creating pastes
  - No update/delete policies (pastes are immutable once created)

  ## Important Notes
  1. The `remaining_views` field is decremented atomically on each fetch
  2. The `expires_at` field is calculated at creation time using `created_at + ttl_seconds`
  3. Both constraints are enforced: paste expires when EITHER triggers
  4. View decrement must be atomic to handle concurrent requests safely
*/

CREATE TABLE IF NOT EXISTS pastes (
  id text PRIMARY KEY,
  content text NOT NULL,
  ttl_seconds integer,
  max_views integer,
  remaining_views integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT valid_ttl CHECK (ttl_seconds IS NULL OR ttl_seconds >= 1),
  CONSTRAINT valid_max_views CHECK (max_views IS NULL OR max_views >= 1),
  CONSTRAINT valid_remaining_views CHECK (remaining_views IS NULL OR remaining_views >= 0)
);

ALTER TABLE pastes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pastes by ID"
  ON pastes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create pastes"
  ON pastes
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at) WHERE expires_at IS NOT NULL;