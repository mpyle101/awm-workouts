import { join } from 'path'
import pg_promise = require('pg-promise')
import { IDatabase, ITask } from 'pg-promise'
const pgp = pg_promise()

export type Database = IDatabase<any> | ITask<any>

export const load_sql = (fname: string) => {
  const path = join(__dirname, 'sql', fname)
  return new pgp.QueryFile(path, {minify: true})
}
const sql_truncate_all     = load_sql('truncate_all.sql')
const sql_insert_user      = load_sql('insert_user.sql')
const sql_insert_workout   = load_sql('insert_workout.sql')
const sql_insert_block     = load_sql('insert_block.sql')
const sql_insert_fbt_block = load_sql('insert_fbt_block.sql')
const sql_insert_hic_block = load_sql('insert_hic_block.sql')
const sql_insert_se_block  = load_sql('insert_se_block.sql')
const sql_insert_set       = load_sql('insert_set.sql')
const sql_insert_set_group = load_sql('insert_set_group.sql')

export const create_db = (url: string) => pgp(url)

export const truncate_all = (db: Database) => db.query(sql_truncate_all)

export const insert_user = async (db: Database, user) =>
  await db.one(sql_insert_user, user, user => user.id) as number

export const insert_workout = (
  db: Database,
  user_id: number,
  seqno: number,
  date: string,
  csv: string,
) =>
  db.one(
    sql_insert_workout,
    {user_id, date, seqno, csv},
    workout => workout.id as number
  )

export const insert_block = (
  db: Database,
  user_id: number,
  workout_id: number,
  seqno: number,
  block_type: string,
  duration: string,
  notes: string
) =>
  db.one(
    sql_insert_block,
    { user_id, workout_id, block_type, seqno, duration, notes },
    block => block.id as number
  )

export const insert_fbt_block = (
  db: Database,
  user_id: number,
  block_id: number,
  exercise: string,
  block: any
) => {
  const style = block.style
  const duration = block.work
  return db.none(
    sql_insert_fbt_block,
    { user_id, block_id, exercise, style, duration }
  )
}

export const insert_se_block = (
  db: Database,
  user_id: number,
  block_id: number,
  block: any
) => {
  const duration = block.time
  return db.none(sql_insert_se_block, { user_id, block_id, duration })
}

export const insert_hic_block = (
  db: Database,
  user_id: number,
  block_id: number,
  block: any
) => {
  const style = block.key

  let duration = null
  let distance = null
  if (style === 'TAB') {
    duration = block.work
  } else if (style === 'CIR' || style === 'AMRAP') {
    duration = block.meta
  } else if (style === 'INT') {
    duration = block.rest
    distance = block.meta
  }

  return db.none(
    sql_insert_hic_block,
    { user_id, block_id, style, duration, distance }
  )
}


interface ISetGroup {
  user_id: number,
  block_id: number
  style: string
  duration: string | null
  seqno: number
}
export const insert_set_group = (db: Database, sq: ISetGroup) => 
  db.one(sql_insert_set_group, sq, group => group.id as number)


const set_group_columns = new pgp.helpers.ColumnSet([
  'user_id', 'block_id', 'style', 'seqno'
], { table: { table: 'set_group', schema: 'awm' } })

export const insert_set_groups = (db: Database, values) =>
  db.many(pgp.helpers.insert(values, set_group_columns) + 'RETURNING id')


const set_columns = new pgp.helpers.ColumnSet([
  'user_id', 'block_id', 'group_id', 'exercise', 'unit', 'set_type',
  'weight', 'notes', 'setno', 'reps', 'duration', 'distance'
], { table: { table: 'set', schema: 'awm' } })

export const insert_sets = (db: Database, values) =>
  db.none(pgp.helpers.insert(values, set_columns))


const exercise_columns = new pgp.helpers.ColumnSet([
  'key', 'name', 'weight_unit'
], { table: { table: 'exercise', schema: 'awm' } })

export const insert_exercises = (db: Database, values) =>
  db.none(pgp.helpers.insert(values, exercise_columns))


const cycle_columns = new pgp.helpers.ColumnSet([
  'user_id', 'name', 'start_date', 'end_date'
], { table: { table: 'cycle', schema: 'awm' } })

export const insert_cycles = (db: Database, values) =>
  db.none(pgp.helpers.insert(values, cycle_columns))