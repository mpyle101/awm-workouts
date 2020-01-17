import { sql, DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'

type Database = DatabasePoolType | DatabaseTransactionConnectionType

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
      awm.exercise,
      awm.user
    `)

export const insert_user = async (db: Database, user) => {
  const user_id = await db.oneFirst(sql`
    INSERT INTO awm.user (username, password, email, first_name, last_name)
    VALUES (
      ${user.username},
      ${user.password},
      ${user.email},
      ${user.first_name},
      ${user.last_name}
    )
    RETURNING id
  `)

  return user_id as string
}

export const insert_exercise = (db: Database, rec) => 
  db.query(sql`
    INSERT INTO awm.exercise (key, name, exercise_unit)
    VALUES (${rec.key}, ${rec.name}, ${rec.unit})
  `)


export const insert_workout = async (
  db: Database,
  user_id: string,
  seqno: number,
  workout
) => {
  const date = workout.date.$date.split('T')[0]
  const workout_id = await db.oneFirst(sql`
    INSERT INTO awm.workout (date, user_id, seqno)
    VALUES (${date}, ${user_id}, ${seqno})
    RETURNING id`)

  return workout_id as number
}

const insert_block = async (
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

export const insert_ms_block = async (
  db: Database,
  workout_id: number,
  seqno: number,
  block: any
) => {
  const notes = block.notes || null
  const block_id = await insert_block(db, workout_id, seqno, 'MS', notes)
}
