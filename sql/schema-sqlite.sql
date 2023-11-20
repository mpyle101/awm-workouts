DROP TABLE IF EXISTS fbt_style_t;
CREATE TABLE fbt_style_t (key TEXT PRIMARY KEY);
INSERT INTO fbt_style_t VALUES
    ('HP'),     -- Hypertrophy
    ('MS'),     -- Max Strength
    ('SE'),     -- Strength Endurance
    ('SS');     -- Super sets

DROP TABLE IF EXISTS group_style_t;
CREATE TABLE group_style_t (key TEXT PRIMARY KEY);
INSERT INTO group_style_t VALUES
    ('AS'),     -- Alternating sets
    ('CLUS'),   -- Cluster sets
    ('DROP'),   -- Drop sets
    ('EMOM'),   -- Every Minute On the Minute
    ('MYO'),    -- Myorep Sets
    ('MYOM'),   -- Myorep Match
    ('RP'),     -- Rest/Pause sets
    ('SS'),     -- Super sets
    ('GS'),     -- Giant sets
    ('STD'),    -- Standard sets
    ('WAVE');   -- Contrast Wave

DROP TABLE IF EXISTS hic_style_t;
CREATE TABLE hic_style_t (key TEXT PRIMARY KEY);
INSERT INTO hic_style_t VALUES
    ('AMRAP'),  -- As Many Reps (sets) As Possible
    ('CIR'),    -- Curcuit
    ('INT'),    -- Intervals
    ('TAB');    -- Tabata

DROP TABLE IF EXISTS set_type_t;
CREATE TABLE set_type_t (key TEXT PRIMARY KEY);
INSERT INTO set_type_t VALUES
    ('STD'),    -- Standard
    ('TMD'),    -- Timed
    ('DST');    -- Distance

DROP TABLE IF EXISTS block_type_t;
CREATE TABLE block_type_t (key TEXT PRIMARY KEY);
INSERT INTO block_type_t VALUES
    ('MS'),     -- Max Strength
    ('EN'),     -- Endurance
    ('SE'),     -- Strength Endurance
    ('GC'),     -- General Conditioning
    ('FBT'),    -- Fobbit
    ('HIC'),    -- Hign Intensity Conditioning
    ('HGC'),    -- High Intensity General Conditioning
    ('HYP'),    -- Hypertrophy
    ('OFF');    -- No workout

DROP TABLE IF EXISTS weight_unit_t;
CREATE TABLE weight_unit_t (key TEXT PRIMARY KEY);
INSERT INTO weight_unit_t VALUES
    ('KG'),     -- Kilograms
    ('LB'),     -- Pounds
    ('BW');     -- Body weight


DROP TABLE IF EXISTS user;
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(72),
    email TEXT,
    first_name TEXT,
    last_name TEXT
);

DROP TABLE IF EXISTS exercise;
CREATE TABLE exercise (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    weight_unit TEXT NOT NULL REFERENCES weight_unit_t (key)
);

DROP TABLE IF EXISTS cycle;
CREATE TABLE cycle (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user (id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

DROP TABLE IF EXISTS workout;
CREATE TABLE workout (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user (id),
    csv TEXT NOT NULL,
    seqno SMALLINT NOT NULL,
    workout_date DATE CHECK (workout_date > '2015-01-01'),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
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
DROP TABLE IF EXISTS block;
CREATE TABLE block (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user (id),
    workout_id INTEGER NOT NULL REFERENCES workout (id),
    block_type TEXT NOT NULL REFERENCES block_type_t (key),
    duration TEXT,
    seqno SMALLINT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    UNIQUE (id, block_type)
);

-- #E FOBBIT (MS)	Trainer	GD: 4x0x10	PD: 4x110x10	65m
-- 1 block (FBT) / 1 fbt_block (MS, TRNR, 60m)
-- 1 set_group / 4 sets (GD, STD)
-- 1 set group / 4 sets (PD, STD)
DROP TABLE IF EXISTS fbt_block;
CREATE TABLE fbt_block (
    id INTEGER PRIMARY KEY REFERENCES block (id),
    user_id INTEGER NOT NULL REFERENCES user (id),
    exercise TEXT NOT NULL REFERENCES exercise (key),
    style TEXT NOT NULL REFERENCES fbt_style_t (key),
    duration TEXT,
    block_type TEXT DEFAULT 'FBT' CHECK (block_type = 'FBT'),
    FOREIGN KEY (id, block_type) REFERENCES block (id, block_type)
);

-- #HIC	TABATA (4m)	Trainer
-- 1 block (HIC) / 1 hic_block (TAB, 4m)
-- 1 set_group (STD), 1 set (TRNR, TMD, 4m)
--
-- #HIC	ROW, 5x1m, Rest: 1m, 1484m
-- 1 block (HIC) / 1 hic_block (INT, 1m, 1484m)
-- 1 set_group (SS), 5 sets (ROW, TMD, 1m)
-- #HIC	ROW, 5x2m, Rest: 4m
-- #HIC	ROW, 5x2m, Rest: 3-5m
-- #HIC	RUN (HS), 5x40s, REST: 2m
--
-- #HIC	DESC (10@27m2s), IR, BRP, SJ, RPS
-- 1 block (HIC) / 1 hic_block (CIR, 27m2s)
-- 1 set_group (SS) / 4 sets (IR, 10), (BRP, 10) (SJ, 10) (RPS 10)
-- 1 set_group (SS) / 4 sets (IR, 9), (BRP, 9) (SJ, 9) (RPS 9)
-- ...
-- 1 set_group (SS) / 4 sets (IR, 1), (BRP, 1) (SJ, 1) (RPS 1)
-- #HIC	DESC (10@24m20s), BBRx40, BRP, SJ, RPS
DROP TABLE IF EXISTS hic_block;
CREATE TABLE hic_block (
    id INTEGER PRIMARY KEY REFERENCES block (id),
    user_id INTEGER NOT NULL REFERENCES user (id),
    style TEXT NOT NULL REFERENCES hic_style_t (key),
    duration TEXT,
    distance TEXT,
    block_type TEXT DEFAULT 'HIC' CHECK (block_type = 'HIC'),
    FOREIGN KEY (id, block_type) REFERENCES block (id, block_type)
);

-- Strength Endurance
DROP TABLE IF EXISTS se_block;
CREATE TABLE se_block (
    id INTEGER PRIMARY KEY REFERENCES block (id),
    user_id INTEGER NOT NULL REFERENCES user (id),
    duration TEXT,
    block_type TEXT DEFAULT 'SE' CHECK (block_type = 'SE'),
    FOREIGN KEY (id, block_type) REFERENCES block (id, block_type)
);

-- Tracks a collection of one or more sets by logical grouping
-- seqno => group number within a block
-- #MS	SDL: 93x5, 109x1, 97x5, 113x1, 101x5, 117x1
-- 1 block (MS)
-- 1 set_group (STD), 6 set/standard_set
-- #HIC	AMRAP (10m), KBS/2: 3x24x10; PS: 10, 10, 10; RR: 3x45x5; STEP: 5, 5, 5
-- 1 block / 1 hic_block (AMRAP, 10m)
-- 1 set_group (SS) / 12 sets in order
-- #HIC	CIRCUIT, KBS/2: 4x20x20s; PS: 20s, 20s, 20s, 20s; BJ: 20s, 20s, 20s, 20s; Rest: 4x1m
-- 1 block / 1 hic_block
-- 4 set_group (CIR) w/KBS/2 set (20s), PS set (20s), BJ set (20s), Rest set (1m)
-- #HIC	CIRCUIT (11m52s); JR: 90s, 90s, 60s, 60s; GD: 10, 10, 8, 8; TRX: 12, 12, 10, 10
-- 4 set_group (CIR) w/JR set, GD set, TRX set
-- RD/IR => 2 standard_set w/group_id to 1 set_group (SUPER)
-- 3 1/6 contrast waves => 2 set w/group_id to 1 set_group (WAVE) per wave
-- 3/3/2 => 3 standard_set w/group_id to 1 set_group (CLUS, 20s)
-- 5 on the minute => 5 standard_set w/group_id to 1 set_group (EMOM, 1m)
-- #HIC	TABATA (4m)	Trainer
-- 1 block (HIC) / 1 hic_block (TAB, 4m)
-- 1 set_group (STD), 1 set (TRNR, 4m)
DROP TABLE IF EXISTS set_group;
CREATE TABLE set_group (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user (id),
    block_id INTEGER NOT NULL REFERENCES block (id),
    style TEXT NOT NULL REFERENCES group_style_t (key),
    seqno SMALLINT NOT NULL
);

-- Basic workout set values
-- setno => set number within a group
-- set_type: STD (reps), TMD & DST (period or distance or both)
-- reps     => exercise done a number of times
-- duration => exercise time interval
-- distance => exercise distance
DROP TABLE IF EXISTS workout_set;
CREATE TABLE workout_set (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user (id),
    block_id INTEGER NOT NULL REFERENCES block (id),
    group_id INTEGER NOT NULL REFERENCES set_group (id),
    exercise TEXT NOT NULL REFERENCES exercise (key),
    weight_unit TEXT NOT NULL REFERENCES weight_unit_t (key),
    set_type TEXT NOT NULL REFERENCES set_type_t (key),
    weight REAL DEFAULT 0.0 NOT NULL,
    setno SMALLINT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    reps SMALLINT,
    duration TEXT,
    distance TEXT,
    UNIQUE (id, set_type)
);


