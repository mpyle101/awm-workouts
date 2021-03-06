import { writeFileSync } from 'fs'

import {
  connect,
  insert_block,
  insert_fbt_block,
  insert_hic_block,
  insert_se_block,
  insert_sets,
  insert_set_groups,
  insert_workout,
  truncate_all
} from './db-utils'

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
        let workout_id = await insert_workout(trx, user_id, order, date)
        let seqno = 0
        for (const block of rec.blocks) {
          seqno += 1
          const notes = block.notes || '';
          const block_type = get_block_type(block)
          if (block_type === 'BR') {
            seqno -= 1
            order += 1
            count += 1
            workout_id = await insert_workout(trx, user_id, order, date)
            continue
          } else {
            const block_id = await insert_block(trx, workout_id, seqno, block_type, notes)
            if (block_type === 'FBT') {
              await insert_fbt_block(trx, block_id, 'TRNR', block)
            } else if (block_type === 'SE') {
              await insert_se_block(trx, block_id, block)
            } else if (block_type === 'HIC') {
              await insert_hic_block(trx, block_id, block)
            }

            const blk_grps: any[] = []
            const blk_sets: any[] = []
            for (const groups of get_set_groups(block_id, block)) {
              for (const { group, sets } of groups) {
                blk_grps.push(group)
                blk_sets.push(sets)
              }
            }
            if (blk_grps.length) {
              const group_ids = (await insert_set_groups(trx, blk_grps)).map(g => g.id)
              const set_recs = group_ids.reduce((acc, group_id, idx) =>
                acc.concat(blk_sets[idx].map(s => ({ ...s, group_id }))), [])
              await insert_sets(trx, set_recs)
            }
          }
        }
      })
    } catch (e) {
      console.log(`Failed to insert workout from ${date}:`, e)
      break
    }
  }

  console.log(`${count} workouts inserted`)
  db.$pool.end()
}

main().then(() => console.log('done'))
