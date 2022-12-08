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

@read:
    echo 'Converting to JSON'
    python3 ./reader.py

reload: export read load

setup:
    echo 'Creating database schema'
    @sqlite /space/awm-data/awm.db ".read ./sql/schema-sqlite.sql"