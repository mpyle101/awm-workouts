#! /usr/local/bin/fish

dropdb -h localhost -U jester awm
createdb -h localhost -U jester awm
psql -h localhost -U jester -d awm -f ./sql/schema.sql -q
