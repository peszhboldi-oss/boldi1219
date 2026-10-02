-- Impavidus Lab initial PostgreSQL schema.
-- Apply only after PostgreSQL is configured. No sample/client data is inserted.

CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text,
    role text NOT NULL CHECK (role IN ('client', 'coach', 'admin')),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE client_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    started_on date,
    starting_weight_kg numeric(6,2) CHECK (starting_weight_kg > 0),
    height_cm numeric(6,2) CHECK (height_cm > 0),
    goal text NOT NULL DEFAULT '',
    meals_per_day smallint NOT NULL DEFAULT 5 CHECK (meals_per_day IN (5, 6)),
    blood_pressure_enabled boolean NOT NULL DEFAULT false,
    blood_glucose_enabled boolean NOT NULL DEFAULT false,
    blood_test_enabled boolean NOT NULL DEFAULT false,
    blood_test_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coach_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coach_client_assignments (
    coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    active boolean NOT NULL DEFAULT true,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    PRIMARY KEY (coach_id, client_id),
    CHECK ((active AND ended_at IS NULL) OR (NOT active))
);

CREATE INDEX coach_client_assignments_client_idx ON coach_client_assignments(client_id, active);

CREATE TABLE daily_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    sleep_hours numeric(4,2) CHECK (sleep_hours BETWEEN 0 AND 24),
    sleep_rating smallint CHECK (sleep_rating BETWEEN 1 AND 5),
    stress_rating smallint CHECK (stress_rating BETWEEN 1 AND 5),
    energy_rating smallint CHECK (energy_rating BETWEEN 1 AND 5),
    adherence_rating smallint CHECK (adherence_rating BETWEEN 1 AND 5),
    pain_rating numeric(3,1) CHECK (pain_rating BETWEEN 0 AND 10),
    pain_location text,
    blood_pressure text,
    blood_glucose numeric(6,2),
    bowel_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, log_date)
);

CREATE TABLE exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    muscle_group text NOT NULL DEFAULT '',
    equipment text NOT NULL DEFAULT '',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workout_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES coach_profiles(id) ON DELETE SET NULL,
    name text NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, name, version)
);

CREATE TABLE workout_plan_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    position integer NOT NULL CHECK (position >= 0),
    planned_sets smallint NOT NULL CHECK (planned_sets > 0),
    planned_reps smallint CHECK (planned_reps > 0),
    planned_weight_kg numeric(7,2) CHECK (planned_weight_kg >= 0),
    note text NOT NULL DEFAULT '',
    UNIQUE (plan_id, position)
);

CREATE TABLE workout_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES workout_plans(id) ON DELETE SET NULL,
    session_date date NOT NULL,
    title text NOT NULL,
    session_type text NOT NULL CHECK (session_type IN ('workout', 'rest')),
    note text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, session_date)
);

CREATE TABLE workout_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    position integer NOT NULL CHECK (position >= 0),
    set_number smallint NOT NULL CHECK (set_number >= 0),
    is_warmup boolean NOT NULL DEFAULT false,
    planned_reps smallint CHECK (planned_reps > 0),
    planned_weight_kg numeric(7,2) CHECK (planned_weight_kg >= 0),
    actual_reps smallint CHECK (actual_reps BETWEEN 1 AND 100),
    actual_weight_kg numeric(7,2) CHECK (actual_weight_kg BETWEEN 0 AND 500),
    rpe smallint CHECK (rpe BETWEEN 6 AND 10),
    completed boolean NOT NULL DEFAULT false,
    note text NOT NULL DEFAULT '',
    UNIQUE (session_id, position)
);

CREATE TABLE meal_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES coach_profiles(id) ON DELETE SET NULL,
    name text NOT NULL,
    target_kcal numeric(8,2) CHECK (target_kcal >= 0),
    target_protein_g numeric(8,2) CHECK (target_protein_g >= 0),
    target_carbs_g numeric(8,2) CHECK (target_carbs_g >= 0),
    target_fat_g numeric(8,2) CHECK (target_fat_g >= 0),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meal_plan_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    position smallint NOT NULL CHECK (position >= 0),
    name text NOT NULL,
    UNIQUE (meal_plan_id, position)
);

CREATE TABLE foods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kcal_per_100g numeric(8,2) NOT NULL CHECK (kcal_per_100g >= 0),
    protein_g_per_100g numeric(8,2) NOT NULL CHECK (protein_g_per_100g >= 0),
    carbs_g_per_100g numeric(8,2) NOT NULL CHECK (carbs_g_per_100g >= 0),
    fat_g_per_100g numeric(8,2) NOT NULL CHECK (fat_g_per_100g >= 0),
    source text NOT NULL DEFAULT 'custom',
    source_license text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meal_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id uuid NOT NULL REFERENCES meal_plan_meals(id) ON DELETE CASCADE,
    food_id uuid NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    quantity_g numeric(8,2) NOT NULL CHECK (quantity_g > 0),
    position smallint NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE TABLE food_log_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    meal_position smallint NOT NULL CHECK (meal_position >= 0),
    food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
    food_name_snapshot text NOT NULL,
    quantity_g numeric(8,2) NOT NULL CHECK (quantity_g > 0),
    kcal_per_100g_snapshot numeric(8,2) NOT NULL CHECK (kcal_per_100g_snapshot >= 0),
    protein_g_per_100g_snapshot numeric(8,2) NOT NULL CHECK (protein_g_per_100g_snapshot >= 0),
    carbs_g_per_100g_snapshot numeric(8,2) NOT NULL CHECK (carbs_g_per_100g_snapshot >= 0),
    fat_g_per_100g_snapshot numeric(8,2) NOT NULL CHECK (fat_g_per_100g_snapshot >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    dose numeric(9,3) NOT NULL CHECK (dose > 0),
    unit text NOT NULL,
    timing text NOT NULL DEFAULT '',
    phase text NOT NULL DEFAULT '',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE medication_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    changed_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
    old_dose numeric(9,3) NOT NULL CHECK (old_dose > 0),
    new_dose numeric(9,3) NOT NULL CHECK (new_dose > 0),
    changed_at timestamptz NOT NULL DEFAULT now(),
    note text NOT NULL DEFAULT ''
);

CREATE TABLE measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    measured_on date NOT NULL,
    weight_kg numeric(6,2) NOT NULL CHECK (weight_kg > 0),
    waist_cm numeric(6,2) CHECK (waist_cm > 0),
    chest_cm numeric(6,2) CHECK (chest_cm > 0),
    arm_cm numeric(6,2) CHECK (arm_cm > 0),
    thigh_cm numeric(6,2) CHECK (thigh_cm > 0),
    shoulder_cm numeric(6,2) CHECK (shoulder_cm > 0),
    calf_cm numeric(6,2) CHECK (calf_cm > 0),
    note text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, measured_on)
);

CREATE TABLE progress_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    captured_on date NOT NULL,
    view_label text NOT NULL DEFAULT '',
    private_object_key text NOT NULL UNIQUE,
    content_type text NOT NULL,
    byte_size bigint NOT NULL CHECK (byte_size > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE client_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    author_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    note_date date NOT NULL DEFAULT CURRENT_DATE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    client_id uuid REFERENCES client_profiles(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    request_id uuid
);

CREATE INDEX daily_logs_client_date_idx ON daily_logs(client_id, log_date DESC);
CREATE INDEX workout_sessions_client_date_idx ON workout_sessions(client_id, session_date DESC);
CREATE INDEX food_log_entries_client_date_idx ON food_log_entries(client_id, log_date DESC);
CREATE INDEX measurements_client_date_idx ON measurements(client_id, measured_on DESC);
CREATE INDEX medications_client_active_idx ON medications(client_id, active);
CREATE INDEX client_notes_client_date_idx ON client_notes(client_id, note_date DESC);
CREATE INDEX audit_events_client_time_idx ON audit_events(client_id, occurred_at DESC);
