default:
    @just --list

build:
    @npm run build

@export:
    echo 'Exporting to CSV'
    osascript ./export.scpt

@convert:
    echo 'Converting to JSON'
    python3 ./reader.py

@load:
    echo 'Loading into database'
    node build/main.js

doit: export convert load

setup:
    echo 'Creating database schema'
    @sqlite /space/awm-data/awm.db ".read ./sql/schema-sqlite.sql"