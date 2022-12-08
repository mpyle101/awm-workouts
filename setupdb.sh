#! /bin/zsh

sqlite /space/awm-data/awm.db ".read ./sql/schema-sqlite.sql"

#dropdb -h localhost -U jester awm
#createdb -h localhost -U jester awm
#psql -h localhost -U jester -d awm -f ./sql/schema.sql -q