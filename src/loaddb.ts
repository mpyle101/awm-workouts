import { createReadStream } from 'fs'
import { parse } from 'JSONStream'
import { createPool, sql, DatabasePoolType } from 'slonik'

import {
  insert_block,
  insert_cycle,
  insert_exercise,
  insert_user,
  insert_workout,
  truncate_all
} from './dbutils'

import {
  get_block_type,
  insert_mpyle,
  load_cycles,
  load_exercises,
  read_json
} from './utils'

const main = async () => {
  const db = createPool('postgres://jester@localhost/awm')

  try {
    await truncate_all(db)
    console.log('Tables cleared')
    await load_exercises(db)
    console.log('Exercises loaded')
    await load_cycles(db)
    console.log('Cycles loaded')
  } catch (e) {
    console.log('Failed to initialize:', e)
    process.exit()
  }
  
  const user_id = await insert_mpyle(db)
  console.log('User created')

  let seqno = 1
  let failed = 0
  let last_workout = null
  await read_json('./workouts.json', async rec => {
    const date = rec.date.$date.split('T')[0]
    seqno = date === last_workout ? seqno + 1 : 1
    last_workout = date

    try {
      await db.transaction(async trx => {
        let block_no = 0
        const workout_id = await insert_workout(trx, user_id, seqno, date)
        for (const block of rec.blocks) {
          block_no++
          const notes = block.notes || null;
          const block_type = get_block_type(block)
          const block_id = await insert_block(trx, workout_id, block_no, block_type, notes)
        }
      })
    } catch (e) {
      failed += 1
      console.log('Failed to insert workout:', failed, e)
    }
  })

  await db.end()
}

main()
