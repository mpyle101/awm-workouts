import { create_db } from './db-utils'

(async () => {
  const db = create_db('postgres://jester@localhost/awm')

  const user = await db.one('SELECT * FROM awm.user')
  console.log('User: ', user)

  const cycles = await db.many('SELECT * FROM awm.cycle')
  console.log('Cycles: ', cycles.length)

  const exercises = await db.many('SELECT * FROM awm.exercise')
  console.log('Exercises: ', exercises.length)

  const workouts = await db.many('SELECT * FROM awm.workout')
  console.log('Workouts: ', workouts.length)

  const blocks = await db.many('SELECT * FROM awm.block')
  console.log('Blocks: ', blocks.length)

  const fbt_blocks = await db.many('SELECT * FROM awm.fbt_block')
  console.log('FBT Blocks: ', fbt_blocks.length)

  const hic_blocks = await db.many('SELECT * FROM awm.hic_block')
  console.log('HIC Blocks: ', hic_blocks.length)

  const se_blocks = await db.many('SELECT * FROM awm.se_block')
  console.log('SE Blocks: ', se_blocks.length)

  const groups = await db.many('SELECT * FROM awm.set_group')
  console.log('Set Groups: ', groups.length)

  const sets = await db.many('SELECT * FROM awm.set')
  console.log('Sets: ', sets.length)

  db.$pool.end()
})()

