import { open_db } from './db-utils'

(() => {
    const db = open_db('./awm.db')

    let stmt = db.prepare('SELECT * FROM user')
    const user = stmt.get()
    console.log('User: ', user)

    stmt = db.prepare('SELECT * FROM cycle')
    const cycles = stmt.all()
    console.log('Cycles: ', cycles.length)

    stmt = db.prepare('SELECT * FROM exercise')
    const exercises = stmt.all()
    console.log('Exercises: ', exercises.length)

    stmt = db.prepare('SELECT * FROM workout')
    const workouts = stmt.all()
    console.log('Workouts: ', workouts.length)

    stmt = db.prepare('SELECT * FROM block')
    const blocks = stmt.all()
    console.log('Blocks: ', blocks.length)

    stmt = db.prepare('SELECT * FROM fbt_block')
    const fbt_blocks = stmt.all()
    console.log('FBT Blocks: ', fbt_blocks.length)

    stmt = db.prepare('SELECT * FROM hic_block')
    const hic_blocks = stmt.all()
    console.log('HIC Blocks: ', hic_blocks.length)

    stmt = db.prepare('SELECT * FROM se_block')
    const se_blocks = stmt.all()
    console.log('SE Blocks: ', se_blocks.length)

    stmt = db.prepare('SELECT * FROM set_group')
    const groups = stmt.all()
    console.log('Set Groups: ', groups.length)

    stmt = db.prepare('SELECT * FROM workout_set')
    const sets = stmt.all()
    console.log('Sets: ', sets.length)
})()

