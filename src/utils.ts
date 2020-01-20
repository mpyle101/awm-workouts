import { readFile } from 'fs'
import { Database } from './dbutils'
import {
  create_set_record,
  from_gc_block,
  from_ms_clus,
  from_ms_emom,
  from_ms_block,
  from_ss_block,
  get_group_style
} from './factories'

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


export function* get_set_groups(block_id: number, block) {
  let seqno = { value: 0 }
  if (block.type === 'MS') {
    for (const work of block.work) {
      const style = get_group_style(work.style)
      if (style === 'CLUS') {
        yield from_ms_clus(seqno, block_id, work)
      } else if (style === 'EMOM') {
        yield from_ms_emom(seqno, block_id, work)
      } else {
        yield from_ms_block(seqno, block_id, work)
      }
    }
  } else if (block.type === 'SS') {
    yield from_ss_block(seqno, block_id, block.sets)
  } else if (block.type === 'GC') {
    yield from_gc_block(seqno, block_id, block)
  }

  return []
}
