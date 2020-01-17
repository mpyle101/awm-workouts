CREATE EXTENSION pgcrypto;

\connect awm;
CREATE SCHEMA awm;

CREATE TYPE awm.fbt_style_t AS ENUM ('MS', 'SE');
CREATE TYPE awm.hic_style_t AS ENUM ('INT', 'TAB', 'CIR', 'DESC', 'AMRAP');

CREATE TYPE awm.set_type_t AS ENUM ('STD', 'TMD', 'DST');

-- AMRAP: As Many Reps/Sets As Possible
-- CIR: Circuit
-- CLUS: Cluster
-- EMOM: Every Minute on the Minute
-- FNT: FOBBIT
-- NR: No rest
-- SS: Super Set
-- TAB: Tabata
-- WAVE: Contrast wave
CREATE TYPE awm.group_style_t AS ENUM ('STD', 'AMRAP', 'CIR', 'CLUS', 'EMOM', 'FBT', 'NR', 'SS', 'TAB', 'WAVE');
CREATE TYPE awm.block_type_t AS ENUM ('MS', 'EN', 'SE', 'GC', 'FBT', 'HIC', 'HGC', 'OFF');

CREATE TYPE awm.exercise_unit_t AS ENUM ('KG', 'LB', 'BW');
CREATE TYPE awm.distance_unit_t AS ENUM ('MT', 'MI', 'FT');

CREATE TABLE awm.user (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(72),
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR
);

CREATE TABLE awm.exercise (
    key VARCHAR PRIMARY KEY,
    name VARCHAR,
    exercise_unit awm.exercise_unit_t
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
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workout_id INT REFERENCES awm.workout (id),
    block_type awm.block_type_t,
    seqno SMALLINT,
    notes VARCHAR,
    UNIQUE (id, block_type)
);

-- #E FOBBIT (MS)	Trainer	GD: 4x0x10	PD: 4x110x10	65m
-- 1 block (FBT) / 1 fbt_block (MS, TRNR, 60m)
-- 1 set_group / 4 set / 4 standard_set (GD)
-- 1 set group / 4 set / 4 standard_set (PD)
CREATE TABLE awm.fbt_block (
    id BIGINT PRIMARY KEY REFERENCES awm.block (id),
    exercise VARCHAR REFERENCES awm.exercise (key),
    style awm.fbt_style_t,
    period INTERVAL,
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
-- 1 block (HIC) / 1 hic_block (DESC, 27m2s)
-- 1 set_group (NR) / set 10 1R, 10 BRP, 10 SJ, 10 RPS, 9 IR, 9 BRP, 9 SJ, 9 RPS, etc
-- #HIC	DESC (10@24m20s), BBRx40, BRP, SJ, RPS
CREATE TABLE awm.hic_block (
    id BIGINT PRIMARY KEY REFERENCES awm.block (id),
    style awm.hic_style_t,
    period INTERVAL,
    distance SMALLINT,
    distance_unit awm.distance_unit_t,
    block_type awm.block_type_t DEFAULT 'HIC' CHECK (block_type = 'HIC'),
    FOREIGN KEY (id, block_type) REFERENCES awm.block (id, block_type)
);

-- Tracks a collection of sets by logical grouping
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
-- 1 set_group (TAB), 1 set (TRNR) / 1 timed_set (4m)
CREATE TABLE awm.set_group (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    block_id BIGINT REFERENCES awm.block (id),
    style awm.group_style_t,
    interval INTERVAL,
    seqno SMALLINT
);

-- Basic set values
CREATE TABLE awm.set (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    block_id BIGINT REFERENCES awm.block (id),
    group_id BIGINT REFERENCES awm.set_group (id),
    exercise VARCHAR REFERENCES awm.exercise (key),
    exercise_unit awm.exercise_unit_t,
    set_type awm.set_type_t,
    weight REAL,
    notes VARCHAR,
    seqno SMALLINT,
    UNIQUE (id, set_type)
);

-- An exercise done for some number of reps
-- BS 100x5t
CREATE TABLE awm.standard_set (
    id BIGINT PRIMARY KEY REFERENCES awm.set (id),
    reps SMALLINT,
    set_type awm.set_type_t DEFAULT 'STD' CHECK (set_type = 'STD'),
    FOREIGN KEY (id, set_type) REFERENCES awm.set (id, set_type)
);

-- An exercise done for a period of time instead of reps
-- PS for 30s
CREATE TABLE awm.timed_set (
    id BIGINT PRIMARY KEY REFERENCES awm.set (id),
    period INTERVAL,
    set_type awm.set_type_t DEFAULT 'TMD' CHECK (set_type = 'TMD'),
    FOREIGN KEY (id, set_type) REFERENCES awm.set (id, set_type)
);

-- An exercise done over a distance
-- Row 400m
-- Run 2.8mi, 24m48s
CREATE TABLE awm.distance_set (
    id BIGINT PRIMARY KEY REFERENCES awm.set (id),
    period INTERVAL,
    distance REAL,
    distance_unit awm.distance_unit_t,
    set_type awm.set_type_t DEFAULT 'DST' CHECK (set_type = 'DST'),
    FOREIGN KEY (id, set_type) REFERENCES awm.set (id, set_type)
);


