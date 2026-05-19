-- Migration 0008: Add branch_name to profiles (required for JP banking)
ALTER TABLE profiles ADD COLUMN branch_name TEXT;
