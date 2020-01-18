import { connect } from './dbutils'

const main = async () => {
  const db = connect('postgres://jester@localhost/awm')

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
}

main()
