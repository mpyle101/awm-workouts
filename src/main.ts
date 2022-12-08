import { writeFileSync } from 'fs'

import {
  open_db,
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

import { DATABASE, WORKOUTS } from './consts'

const main = () => {
    const db = open_db(DATABASE)
    try {
        truncate_all(db)
    } catch (e) {
        console.log('Failed to clean database:', e)
        process.exit()
    }

    const user_id = insert_mpyle(db)

    try {
        load_exercises(db)
        load_cycles(db, user_id)
    } catch (e) {
        console.log('Failed to initialize:', e)
        process.exit()
    }

    let order = 1
    let count = 0
    let last_workout = null
    for (const rec of read_json(WORKOUTS)) {
        const date = rec.date.$date.split('T')[0]
        order = date === last_workout ? order + 1 : 1
        last_workout = date

        try {
            count += 1
            let workout_id = insert_workout(db, user_id, order, date, rec.csv)
            let seqno = 0
            for (const block of rec.blocks) {
                seqno += 1
                const notes = block.notes || '';
                const block_type = get_block_type(block)
                if (block_type === 'BR') {
                    seqno -= 1
                    order += 1
                    count += 1
                    workout_id = insert_workout(db, user_id, order, date, rec.csv)
                    continue
                } else {
                    const block_id = insert_block(db, user_id, workout_id, seqno, block_type, block.time, notes)
                    if (block_type === 'FBT') {
                        insert_fbt_block(db, user_id, block_id, 'TRNR', block)
                    } else if (block_type === 'SE') {
                        insert_se_block(db, user_id, block_id, block)
                    } else if (block_type === 'HIC') {
                        insert_hic_block(db, user_id, block_id, block)
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
                        const grp_recs = blk_grps.map(g => ({ ...g, user_id }))
                        const group_ids = insert_set_groups(db, grp_recs)
                        const set_recs = group_ids.reduce((acc, group_id, idx) =>
                            acc.concat(blk_sets[idx].map(s => ({ ...s, user_id, group_id }))), [])
                        insert_sets(db, set_recs)
                    }
                }
            }
        } catch (e) {
            console.log(`Failed to insert workout from ${date}:`, e)
            break
        }
    }
    console.log(`${count} workouts inserted`)
}

main()
