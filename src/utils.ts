import { readFile } from 'fs'
import { Database } from './dbutils'
import { create_set_record } from './factory'

import {
  insert_block,
  insert_cycle,
  insert_exercise,
  insert_user,
} from './dbutils'

export const get_block_type = block => {
  if (block.type === 'EN' && block.key === 'FBT') {
    return 'FBT'
  } else if (block.type === 'SS') {
    return 'MS'
  }

  return block.type as string
}

export const insert_mpyle = async db =>
  await insert_user(db, {
    username: 'mpyle',
    password: 'jester',
    email: 'mpyle101@gmail.com',
    first_name: 'Michael',
    last_name: 'Pyle'
  })

export const load_exercises =  async db => {
  for (const rec of await read_json('./exercises.json')) {
    await insert_exercise(db, rec)
  }
}

export const load_cycles = async db => {
  for (const rec of await read_json('./cycles.json')) {
    const start = rec.start.$date.split('T')[0]
    const end = rec.end.$date.split('T')[0]
    await insert_cycle(db, rec.name, start, end)
  }
}

export const read_json = (path: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    readFile(path, (err, data) =>
      err ? reject(err) : resolve(JSON.parse(data.toString()))
    )
  })


const get_group_style = style => style === 'TIMED' ? 'STD' : style as string
const get_set_type = style => style === 'TIMED' ? 'TMD' : 'STD'

export function* get_set_groups(block_id: number, block) {
  let seqno = 0
  if (block.type === 'MS') {
    let setno = 0
    for (const grp of block.work) {
      const style = get_group_style(grp.style)
      const exercise = grp.key
      if (style === 'CLUS') {
        const set_type = 'STD'
        for (const set of grp.sets) {
          const group = { block_id, seqno, style, interval: null }
          const sets = set.reps.map(reps => {
            setno += 1
            const rec = create_set_record(block_id, set_type, exercise, set)
            rec.reps = reps
            rec.setno = setno
            return {...rec}
          })

          for (let i = 0; i < set.count; i++) {
            seqno += 1
            group.seqno = seqno
            console.log(group, sets)
            yield {group, sets}
          }
        }
      } else {
        seqno += 1
        const group = { block_id, seqno, style, interval: null }
        const set_type = get_set_type(grp.style)
        const sets = grp.sets.reduce((acc, set) => {
          const rec = create_set_record(block_id, set_type, exercise, set)
          if (set_type === 'STD') {
            rec.reps = set.reps
          } else {
            rec.period = set.reps
          }
          for (let i = 0; i < set.count; i++) {
            setno += 1
            rec.setno = setno
            acc.push({ ...rec })
          }

          return acc
        }, [])

        yield {group, sets}
      }
    }
  } else if (block.type === 'SS') {
    return {}
  }

  return {}
}
