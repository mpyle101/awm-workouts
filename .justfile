default:
    @just --list

build:
    @npm run build

@export:
    echo 'Exporting to CSV'
    osascript ./export.scpt

@load:
    echo 'Loading workouts into database'
    npm run loaddb

@convert:
    echo 'Converting to JSON'
    python3 ./reader.py

doit: export convert load

setup:
    echo 'Creating database schema'
    @sqlite /space/awm-data/awm.db ".read ./sql/schema-sqlite.sql"