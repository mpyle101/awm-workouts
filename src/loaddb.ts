import { writeFileSync } from 'fs'
import pg_promise = require('pg-promise')

const pgp = pg_promise({ capSQL: true })

import {
  connect,
  insert_block,
  insert_fbt_block,
  insert_hic_block,
  insert_se_block,
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

interface IWorkout {
  date: string
  workout_id: number
  blocks: any[]
}

interface IBlock {
  seqno: number
  notes: string
  type: string
  groups: any[]
}

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
  const workouts: any[] = []

  let order = 1
  let count = 0
  let last_workout = null
  for (const rec of await read_json('./workouts.json')) {
    const date = rec.date.$date.split('T')[0]
    order = date === last_workout ? order + 1 : 1
    last_workout = date

    try {
      await db.tx(async trx => {
        count += 1
        const workout_id = await insert_workout(trx, user_id, order, date)
        const wo: IWorkout = { date, workout_id, blocks: [] }

        let seqno = 0
        for (const block of rec.blocks) {
          seqno += 1
          const notes = block.notes || null;
          const block_type = get_block_type(block)
          if (block_type !== 'BR') {
            const block_id = await insert_block(trx, workout_id, seqno, block_type, notes)
            if (block_type === 'FBT') {
              await insert_fbt_block(trx, block_id, 'TRNR', block)
            } else if (block_type === 'SE') {
              await insert_se_block(trx, block_id, block)
            } else if (block_type === 'HIC') {
              await insert_hic_block(trx, block_id, block)
            }

            const blk: IBlock = { seqno, notes, type: block_type, groups: [] }
            for (const groups of get_set_groups(block_id, block)) {
              for (const { group, sets } of groups) {
                blk.groups.push({ group, sets })
                const group_id = group ? await insert_set_group(trx, group) : null
                await insert_sets(trx, sets.map(s => ({ ...s, group_id })))
              }
            }

            wo.blocks.push(blk)
          }
        }

        workouts.push(wo)
      })
    } catch (e) {
      console.log(`Failed to insert workout from ${date}:`, e)
      break
    }
  }

  writeFileSync('./data.json', JSON.stringify(workouts, null, 2))

  // Await'ing the transaction doesn't appear to actually pause until it's done.
  console.log(`${count} workouts inserted`)
}

main()
