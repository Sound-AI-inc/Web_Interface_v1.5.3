-- Schema sync: Ensure user_onboarding table has country_of_residence column
-- Run this in Supabase SQL Editor if you get:
-- "Could not find the 'country_of_residence' column of 'user_onboarding' in the schema cache"
-- This column is defined in supabase/schema/user_onboarding.sql

alter table public.user_onboarding
  add column if not exists country_of_residence text;
