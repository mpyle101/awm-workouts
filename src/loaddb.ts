import { createReadStream } from 'fs'
import { parse } from 'JSONStream'
import { createPool, sql, DatabasePoolType } from 'slonik'

import {
  insert_exercise,
  insert_ms_block,
  insert_user,
  insert_workout,
  truncate_all
} from './db-utils'

const load_json = (path: string, cb) =>
  new Promise(resolve => {
    const parser = parse('*')
    const pipeline = createReadStream(path).pipe(parser)
    pipeline.on('data', data => cb(data))
    pipeline.on('end', () => resolve())
  })

const main = async () => {
  const db = createPool('postgres://jester@localhost/awm')
  await truncate_all(db)
  console.log('Tables cleared')

  const user_id = await insert_user(db, {
    username: 'mpyle',
    password: 'jester',
    email: 'mpyle101@gmail.com',
    first_name: 'Michael',
    last_name: 'Pyle'
  })
  console.log('User loaded')

  await load_json('./exercises.json', async rec => {
    await insert_exercise(db, rec)
  })
  console.log('Exercises loaded')

  let seqno = 1
  let last_workout = null
  await load_json('./workouts.json', async rec => {
    const date = rec.date.$date
    seqno = date === last_workout ? seqno + 1 : 1
    last_workout = date

    db.transaction(async trx => {
      const workout_id = await insert_workout(trx, user_id, seqno, rec)
      let block_no = 0
      for (const block of rec.blocks) {
        block_no++
        if (block.type === 'MS') {
          await insert_ms_block(trx, workout_id, seqno, block)
        }
      }
    })
  })
  console.log('Workouts loaded')

  await db.end()
}

main()