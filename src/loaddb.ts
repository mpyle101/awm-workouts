import { createReadStream } from 'fs'
import { parse } from 'JSONStream'
import { createPool, sql, DatabasePoolType } from 'slonik'

import {
  insert_ms_block,
  insert_user,
  insert_workout,
  truncate_all
} from './db-utils'

const load_workouts = (path, cb) => {
  const parser = parse('*')
  const pipeline = createReadStream(path).pipe(parser)
  pipeline.on('data', data => cb(data))
}

const main = async () => {
  const db = createPool('postgres://jester@localhost/awm')
  await truncate_all(db)

  const user_id = await insert_user(db, {
    username: 'mpyle',
    password: 'jester',
    email: 'mpyle101@gmail.com',
    first_name: 'Michael',
    last_name: 'Pyle'
  })

  let seqno = 1
  let last_workout = null
  load_workouts('./workouts.json', async workout => {
    const date = workout.date.$date
    date === last_workout ? seqno++ : seqno = 1
    last_workout = date

    db.transaction(async trx => {
      const workout_id = await insert_workout(trx, user_id, seqno, workout)
      let block_no = 1
      for (const block of workout.blocks) {
        if (block.type === 'MS') {
          await insert_ms_block(trx, user_id, workout_id, seqno, block)
        }
      }
    })

  })

  await db.end()
}

main()