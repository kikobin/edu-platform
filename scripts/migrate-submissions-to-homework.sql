-- Migration: rename submission homework_id suffix from :work → :homework.
--
-- Run this AFTER deploying the code that creates submissions with the new
-- ":homework" suffix. The script preserves submission rows + curator
-- comments + statuses — it only rewrites the homework_id column so the
-- in-app gating logic (`progressStore.isLessonUnlocked`) keeps recognising
-- already-approved homework as "approved for this lesson".
--
-- Safe to re-run: the WHERE clause skips rows already migrated.

UPDATE submissions
SET homework_id = REPLACE(homework_id, ':work', ':homework')
WHERE homework_id LIKE '%:work';

-- Sanity check: should return 0 rows after migration.
-- SELECT COUNT(*) FROM submissions WHERE homework_id LIKE '%:work';
