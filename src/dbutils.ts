import { sql, DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'

export type Database = DatabasePoolType | DatabaseTransactionConnectionType

export const truncate_all = (db: Database) =>
  db.query(sql`
    TRUNCATE
      awm.standard_set,
      awm.timed_set,
      awm.distance_set,
      awm.set,
      awm.set_group,
      awm.fbt_block,
      awm.hic_block,
      awm.block,
      awm.workout,
      awm.cycle,
      awm.exercise,
      awm.user
    `)

export const insert_user = async (db: Database, user) =>
  (await db.oneFirst(sql`
    INSERT INTO awm.user (username, password, email, first_name, last_name)
    VALUES (
      ${user.username},
      ${user.password},
      ${user.email},
      ${user.first_name},
      ${user.last_name}
    )
    RETURNING id
  `)) as string

export const insert_exercise = (db: Database, rec) => 
  db.query(sql`
    INSERT INTO awm.exercise (key, name, exercise_unit)
    VALUES (${rec.key}, ${rec.name}, ${rec.unit})
  `)

export const insert_cycle = (db: Database, name, start, end) =>
  db.query(sql`
    INSERT INTO awm.cycle (name, start_date, end_date)
    VALUES (${name}, ${start}, ${end})
  `)

export const insert_workout = async (
  db: Database,
  user_id: string,
  seqno: number,
  date: string
) => (await db.oneFirst(sql`
  INSERT INTO awm.workout (date, user_id, seqno)
  VALUES (${date}, ${user_id}, ${seqno})
  RETURNING id
`)) as number

export const insert_block = async (
  db: Database,
  workout_id: number,
  seqno: number,
  block_type: string,
  notes: string | null
) => (await db.oneFirst(sql`
  INSERT INTO awm.block (workout_id, block_type, seqno, notes)
  VALUES (${workout_id}, ${block_type}, ${seqno}, ${notes})
  RETURNING id
`)) as number
