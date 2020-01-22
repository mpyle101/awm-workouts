import { join } from 'path'
import pg_promise = require('pg-promise')
import { ITask } from 'pg-promise'
const pgp = pg_promise()

export type Database = ReturnType<typeof connect> | ITask<{}>

const load_sql = (fname: string) => {
  const path = join(__dirname, 'sql', fname)
  return new pgp.QueryFile(path, {minify: true})
}
const sql_truncate_all     = load_sql('truncate_all.sql')
const sql_insert_user      = load_sql('insert_user.sql')
const sql_insert_cycle     = load_sql('insert_cycle.sql')
const sql_insert_exercise  = load_sql('insert_exercise.sql')
const sql_insert_workout   = load_sql('insert_workout.sql')
const sql_insert_block     = load_sql('insert_block.sql')
const sql_insert_fbt_block = load_sql('insert_fbt_block.sql')
const sql_insert_se_block  = load_sql('insert_se_block.sql')
const sql_insert_set       = load_sql('insert_set.sql')
const sql_insert_set_group = load_sql('insert_set_group.sql')

export const connect = (url: string) => pgp(url)

export const truncate_all = (db: Database) => db.query(sql_truncate_all)

export const insert_user = async (db: Database, user) =>
  await db.one(sql_insert_user, user, user => user.id) as string

export const insert_exercise = (db: Database, rec) => 
  db.query(sql_insert_exercise, rec)

export const insert_cycle = (db: Database, name, start, end) =>
  db.query(sql_insert_cycle, { name, start, end })

export const insert_workout = async (
  db: Database,
  user_id: string,
  seqno: number,
  date: string
) =>
  db.one(
    sql_insert_workout,
    {date, user_id, seqno},
    workout => workout.id as number
  )

export const insert_block = (
  db: Database,
  workout_id: number,
  seqno: number,
  block_type: string,
  notes: string | null
) =>
  db.one(
    sql_insert_block,
    { workout_id, block_type, seqno, notes },
    block => block.id as number
  )

export const insert_fbt_block = (
  db: Database,
  block_id: number,
  exercise: string,
  style: string,
  duration: string
) => db.none(sql_insert_fbt_block, { block_id, exercise, style, duration })


export const insert_se_block = (
  db: Database,
  block_id: number,
  duration: string
) => db.none(sql_insert_se_block, { block_id, duration })


interface ISetGroup {
  block_id: number
  style: string
  duration: string | null
  seqno: number
}
export const insert_set_group = (db: Database, sq: ISetGroup) => 
  db.one(sql_insert_set_group, sq, group => group.id as number)


interface ISet {
  block_id: number
  group_id: number
  set_type: string
  exercise: string
  unit: string
  weight: number
  reps: number | null
  duration: string | null
  notes: string
  setno: number
}
export const insert_set = (db: Database, set: ISet) =>
  db.one(sql_insert_set, set, set => set.id as number)


const set_columns = new pgp.helpers.ColumnSet([
  'block_id',
  'group_id',
  'exercise',
  'unit',
  'set_type',
  'weight',
  'notes',
  'setno',
  'reps',
  'duration'
], { table: { table: 'set', schema: 'awm' } })

export const insert_sets = (db: Database, values) =>
  db.none(pgp.helpers.insert(values, set_columns))
