'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '001_initial_schema.sql'), 'utf8');

test('az induló séma lefedi a kért adatmodelleket és demóadat nélkül indul', () => {
  for (const table of [
    'accounts', 'client_profiles', 'coach_profiles', 'coach_client_assignments', 'daily_logs',
    'workout_plans', 'workout_sessions', 'workout_sets', 'meal_plans', 'foods',
    'food_log_entries', 'medications', 'measurements', 'progress_photos', 'client_notes',
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table} \\(`));
  }
  assert.doesNotMatch(migration, /\bINSERT\s+INTO\b/i);
});

test('a fotók csak privát objektumtár-kulccsal szerepelnek a relációs sémában', () => {
  const photoTable = migration.split('CREATE TABLE progress_photos (')[1].split(');')[0];
  assert.match(photoTable, /private_object_key text NOT NULL UNIQUE/);
  assert.doesNotMatch(photoTable, /data:image|base64|bytea/i);
});
