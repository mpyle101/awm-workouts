import { writeFileSync } from 'fs'
import pg_promise = require('pg-promise')

const pgp = pg_promise({ capSQL: true })

import {
  connect,
  insert_block,
  insert_cycle,
  insert_exercise,
  insert_sets,
  insert_set_group,
  insert_user,
  insert_workout,
  truncate_all
} from './dbutils'

import {
  get_block_type,
  get_set_groups,
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
  let count = 0
  let last_workout = null
  const workouts: any[] = []
  for (const rec of await read_json('./workouts.json')) {
    const date = rec.date.$date.split('T')[0]
    seqno = date === last_workout ? seqno + 1 : 1
    last_workout = date

    try {
      await db.tx(async trx => {
        let blkno = 0
        const workout_id = await insert_workout(trx, user_id, seqno, date)
        count += 1
        for (const block of rec.blocks) {
          blkno += 1
          const notes = block.notes || null;
          const block_type = get_block_type(block)
          if (block_type !== 'BR') {
            const block_id = await insert_block(trx, workout_id, blkno, block_type, notes)
            for (const tpl of get_set_groups(block_id, block)) {
              workouts.push(tpl)
              const { group, sets } = tpl
              const group_id = await insert_set_group(trx, group)
              await insert_sets(trx, sets.map(s => ({ ...s, group_id })))
            }
          }
        }
      })
    } catch (e) {
      console.log('Failed to insert workout:', e)
      break
    }
  }

  writeFileSync('./data.json', JSON.stringify(workouts, null, 4))

  // Await'ing the transaction doesn't appear to actually pause until it's done.
  console.log(`${count} workouts inserted`)
}

main()
