import { open_db } from './db-utils'

(() => {
    const db = open_db('./awm.db')

    let stmt = db.prepare('SELECT * FROM user')
    const user = stmt.get(stmt)
    console.log('User: ', user)

    stmt = db.prepare('SELECT * FROM cycle')
    const cycles = stmt.get(stmt)
    console.log('Cycles: ', cycles.length)

    stmt = db.prepare('SELECT * FROM exercise')
    const exercises = stmt.get(stmt)
    console.log('Exercises: ', exercises.length)

    stmt = db.prepare('SELECT * FROM workout')
    const workouts = stmt.get(stmt)
    console.log('Workouts: ', workouts.length)

    stmt = db.prepare('SELECT * FROM block')
    const blocks = stmt.get(stmt)
    console.log('Blocks: ', blocks.length)

    stmt = db.prepare('SELECT * FROM fbt_block')
    const fbt_blocks = stmt.get(stmt)
    console.log('FBT Blocks: ', fbt_blocks.length)

    stmt = db.prepare('SELECT * FROM hic_block')
    const hic_blocks = stmt.get(stmt)
    console.log('HIC Blocks: ', hic_blocks.length)

    stmt = db.prepare('SELECT * FROM se_block')
    const se_blocks = stmt.get(stmt)
    console.log('SE Blocks: ', se_blocks.length)

    stmt = db.prepare('SELECT * FROM set_group')
    const groups = stmt.get(stmt)
    console.log('Set Groups: ', groups.length)

    stmt = db.prepare('SELECT * FROM workout_set')
    const sets = stmt.get(stmt)
    console.log('Sets: ', sets.length)
})()

