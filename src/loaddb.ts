import pg_promise = require('pg-promise')
import { createReadStream } from 'fs'
import { parse } from 'JSONStream'

const pgp = pg_promise()

import {
  connect,
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
  const db = connect('postgres://jester@localhost/awm')

  try {
    await truncate_all(db)
    await load_exercises(db)
    await load_cycles(db)
  } catch (e) {
    console.log('Failed to initialize:', e)
    process.exit()
  }
  
  const user_id = await insert_mpyle(db)

  let seqno = 1
  let workouts = 0
  let last_workout = null
  const promises: any[] = []
  await read_json('./workouts.json', async rec => {
    const date = rec.date.$date.split('T')[0]
    seqno = date === last_workout ? seqno + 1 : 1
    last_workout = date

    try {
      const p = db.tx(async trx => {
        let block_no = 0
        const workout_id = await insert_workout(trx, user_id, seqno, date)
        workouts += 1
        for (const block of rec.blocks) {
          block_no++
          const notes = block.notes || null;
          const block_type = get_block_type(block)
          const block_id = await insert_block(trx, workout_id, block_no, block_type, notes)
        }
      })
      promises.push(p)
    } catch (e) {
      console.log('Failed to insert workout:', e)
    }
  })

  await Promise.all(promises)
  console.log(`${workouts} workouts inserted`)
}

main()
