CREATE EXTENSION pgcrypto;

\connect awm;
CREATE SCHEMA awm;

CREATE TYPE awm.fbt_style_t AS ENUM ('MS', 'SE');
CREATE TYPE awm.hic_style_t AS ENUM (
    'AMRAP',    -- As Many Reps (sets) As Possible
    'CIR',      -- Curcuit
    'INT',      -- Intervals
    'TAB'       -- Tabata
);
CREATE TYPE awm.group_style_t AS ENUM (
    'CLUS',     -- Cluster sets
    'EMOM',     -- Every Minute On the Minute
    'SS',       -- Super sets
    'STD',      -- Standard sets
    'WAVE'      -- Contrast Wave
);
CREATE TYPE awm.set_type_t AS ENUM ('STD', 'TMD', 'DST');
CREATE TYPE awm.block_type_t AS ENUM ('MS', 'EN', 'SE', 'GC', 'FBT', 'HIC', 'HGC', 'OFF');
CREATE TYPE awm.exercise_unit_t AS ENUM ('KG', 'LB', 'BW');

CREATE TABLE awm.user (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(72),
    email TEXT,
    first_name TEXT,
    last_name TEXT
);

CREATE TABLE awm.exercise (
    key TEXT PRIMARY KEY,
    name TEXT,
    exercise_unit awm.exercise_unit_t
);

CREATE TABLE awm.cycle (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT,
    start_date DATE,
    end_date DATE
);

CREATE TABLE awm.workout (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES awm.user (id),
    date DATE NOT NULL,
    seqno SMALLINT
);

-- #GC RUN, 2.8mi, 24m56s
-- 1 block (GC), 1 set (RUN), 1 distance_set (2.8mi, 24m56s)
-- #GC BIKE, CX, 70m
-- 1 block (GC), 1 set (BIKE/CX), 1 timed_set (70m)
-- #GC BIKE, TRNR, 70m, Big Ring Ladder x 1
-- 1 block (GC, Big Ring Ladder x 1), 1 set (TRNR), 1 timed_set (70m)
-- #E LSD, Trainer, 60m
-- 1 block (EN), 1 set (TRNR), 1 timed_set (60m)
-- #E RUCK, 30#, 80m, 4.57mi, 17:37, Niwot
-- 1 block (EN, 17:37 Niwot), 1 set (RUCK, 30#), 1 distance_set (4.57mi, 80m)
-- #E HIKE, 115m, 5.2mi Meyers Gulch Trail
-- 1 block (EN, Meyers Gulch Trail), 1 set (HIKE), 1 distance_set (5.2mi, 115m)
-- #HGC ROW, T: 15m, 3374m
-- 1 block (HGC), 1 set (ROW), 1 distance_set (3374m, 15m)
CREATE TABLE awm.block (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workout_id INT REFERENCES awm.workout (id),
    block_type awm.block_type_t,
    seqno SMALLINT,
    notes TEXT,
    UNIQUE (id, block_type)
);

-- #E FOBBIT (MS)	Trainer	GD: 4x0x10	PD: 4x110x10	65m
-- 1 block (FBT) / 1 fbt_block (MS, TRNR, 60m)
-- 1 set_group / 4 set / 4 standard_set (GD)
-- 1 set group / 4 set / 4 standard_set (PD)
CREATE TABLE awm.fbt_block (
    id INT PRIMARY KEY REFERENCES awm.block (id),
    exercise TEXT REFERENCES awm.exercise (key),
    style awm.fbt_style_t,
    duration INTERVAL,
    block_type awm.block_type_t DEFAULT 'FBT' CHECK (block_type = 'FBT'),
    FOREIGN KEY (id, block_type) REFERENCES awm.block (id, block_type)
);

-- #HIC	TABATA (4m)	Trainer
-- 1 block (HIC) / 1 hic_block (TAB)
-- 1 set_group (TAB), 1 set (TRNR) / 1 timed_set (4m)

-- #HIC	ROW, 5x1m, Rest: 1m, 1484m
-- 1 block (HIC) / 1 hic_block (INT, 1484m)
-- 1 set_group (NR), timed_set (ROW, 1m), timed_set (REST, 1m), etc
-- #HIC	ROW, 5x2m, Rest: 4m
-- #HIC	ROW, 5x2m, Rest: 3-5m
-- #HIC	RUN (HS), 5x40s, REST: 2m

-- #HIC	DESC (10@27m2s), IR, BRP, SJ, RPS
-- 1 block (HIC) / 1 hic_block (27m2s)
-- 1 set_group (DESC) / set 10 1R, 10 BRP, 10 SJ, 10 RPS, 9 IR, 9 BRP, 9 SJ, 9 RPS, etc
-- #HIC	DESC (10@24m20s), BBRx40, BRP, SJ, RPS
CREATE TABLE awm.hic_block (
    id INT PRIMARY KEY REFERENCES awm.block (id),
    style awm.hic_style_t,
    duration INTERVAL,
    distance TEXT,
    block_type awm.block_type_t DEFAULT 'HIC' CHECK (block_type = 'HIC'),
    FOREIGN KEY (id, block_type) REFERENCES awm.block (id, block_type)
);

-- Strength Endurance
CREATE TABLE awm.se_block (
    id INT PRIMARY KEY REFERENCES awm.block (id),
    duration INTERVAL,
    block_type awm.block_type_t DEFAULT 'SE' CHECK (block_type = 'SE'),
    FOREIGN KEY (id, block_type) REFERENCES awm.block (id, block_type)
);

-- Tracks a collection of sets by logical grouping
-- seqno => group number within a block
-- #MS	SDL: 93x5, 109x1, 97x5, 113x1, 101x5, 117x1
-- 1 block (MS)
-- 1 set_group (STD), 6 set/standard_set
-- #HIC	AMRAP (10m), KBS/2: 3x24x10; PS: 10, 10, 10; RR: 3x45x5; STEP: 5, 5, 5
-- 1 block / 1 hic_block (10m)
-- 1 set_group (AMRAP) / 12 sets in order
-- #HIC	CIRCUIT, KBS/2: 4x20x20s; PS: 20s, 20s, 20s, 20s; BJ: 20s, 20s, 20s, 20s; Rest: 4x1m
-- 1 block / 1 hic_block
-- 4 set_group (CIR) w/KBS/2 set (20s), PS set (20s), BJ set (20s), Rest set (1m)
-- #HIC	CIRCUIT (11m52s); JR: 90s, 90s, 60s, 60s; GD: 10, 10, 8, 8; TRX: 12, 12, 10, 10
-- 4 set_group (CIR) w/JR set, GD set, TRX set
-- RD/IR => 2 awm.standard_set w/parent_id to 1 set_group (SUPER)
-- 3 1/6 contrast waves => 2 awm.standard_set w/parent_id to 1 set_group (WAVE) per wave
-- 3/3/2 => 3 awm.standard_set w/parent_id to 1 set_group (CLUS, 20s)
-- 5 on the minute => 5 awm.standard_set w/parent_id to 1 set_group (EMOM, 1m)
-- #HIC	TABATA (4m)	Trainer
-- 1 block (HIC) / 1 hic_block (TAB)
-- 1 set_group (TAB), 1 set (TRNR, 4m)
CREATE TABLE awm.set_group (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    block_id INT REFERENCES awm.block (id),
    style awm.group_style_t,
    duration INTERVAL,
    seqno SMALLINT
);

-- Basic set values
-- setno => set number within a group
-- set_type: STD (reps), TMD & DST (period or distance or both)
-- reps     => exercise done a number of times
-- period   => exercise time interval
-- distance => exercise distance
CREATE TABLE awm.set (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    block_id INT REFERENCES awm.block (id),
    group_id INT REFERENCES awm.set_group (id),
    exercise TEXT REFERENCES awm.exercise (key),
    unit awm.exercise_unit_t,
    set_type awm.set_type_t,
    weight REAL,
    notes TEXT,
    setno SMALLINT,
    reps SMALLINT,
    duration INTERVAL,
    distance TEXT,
    UNIQUE (id, set_type)
);


