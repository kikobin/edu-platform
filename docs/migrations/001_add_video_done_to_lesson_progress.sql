-- Migration: add video_done column to lesson_progress
-- Run this in Supabase SQL Editor if lesson_progress table already exists.
-- Safe to run multiple times (IF NOT EXISTS / default value).

alter table lesson_progress
  add column if not exists video_done boolean not null default false;
