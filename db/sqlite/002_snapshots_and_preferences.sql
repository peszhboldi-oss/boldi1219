ALTER TABLE workout_sets ADD COLUMN exercise_note TEXT NOT NULL DEFAULT '';
ALTER TABLE workouts ADD COLUMN plan_version INTEGER;
ALTER TABLE clients ADD COLUMN preferences_json TEXT NOT NULL DEFAULT '{"blood_pressure":false,"blood_glucose":false,"labs":false}';
