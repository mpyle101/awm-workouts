import { createPool, sql, DatabasePoolType } from 'slonik'

const main = async () => {
  const db = createPool('postgres://jester@localhost/awm')

  const users = await db.query(sql`SELECT * FROM awm.user`)
  console.log('Users: ', users.rowCount)

  const cycles = await db.query(sql`SELECT * FROM awm.cycle`)
  console.log('Cycles: ', cycles.rowCount)

  const exercises = await db.query(sql`SELECT * FROM awm.exercise`)
  console.log('Exercises: ', exercises.rowCount)

  const workouts = await db.query(sql`SELECT * FROM awm.workout`)
  console.log('Workouts: ', workouts.rowCount)

  const blocks = await db.query(sql`SELECT * FROM awm.block`)
  console.log('Blocks: ', blocks.rowCount)

  await db.end()
}

main()
