-- Teacher-controlled code editor (per student). Run once on an existing database BEFORE deploying.
-- Existing students keep the editor ON (DEFAULT true); the teacher can switch it off per student.

ALTER TABLE `StudentProfile` ADD COLUMN `codeEnabled` BOOLEAN NOT NULL DEFAULT true;
