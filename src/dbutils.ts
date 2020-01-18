import { join } from 'path'
import pg_promise = require('pg-promise')
import { ITask } from 'pg-promise'
const pgp = pg_promise()

export type Database = ReturnType<typeof connect> | ITask<{}>
export const connect = (url: string) => pgp(url)

const load_sql = (fname: string) => {
  const path = join(__dirname, 'sql', fname)
  return new pgp.QueryFile(path, {minify: true})
}
const sql_truncate_all    = load_sql('truncate_all.sql')
const sql_insert_user     = load_sql('insert_user.sql')
const sql_insert_cycle    = load_sql('insert_cycle.sql')
const sql_insert_exercise = load_sql('insert_exercise.sql')
const sql_insert_workout  = load_sql('insert_workout.sql')
const sql_insert_block    = load_sql('insert_block.sql')

export const truncate_all = (db: Database) => db.query(sql_truncate_all)

export const insert_user = async (db: Database, user) =>
  await db.one(sql_insert_user, user, user => user.id) as string

export const insert_exercise = (db: Database, rec) => 
  db.query(sql_insert_exercise, rec)

export const insert_cycle = (db: Database, name, start, end) =>
  db.query(sql_insert_cycle, {name, start, end})

export const insert_workout = async (
  db: Database,
  user_id: string,
  seqno: number,
  date: string
) => await db.one(
  sql_insert_workout,
  {date, user_id, seqno},
  workout => workout.id
) as number

export const insert_block = async (
  db: Database,
  workout_id: number,
  seqno: number,
  block_type: string,
  notes: string | null
) => await db.one(
  sql_insert_block,
  {workout_id, block_type, seqno, notes},
  block => block.id
) as number
