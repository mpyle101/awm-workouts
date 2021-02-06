import { readFile } from 'fs'
import { Database } from './db-utils'
import {
  create_set_record,
  from_en_block,
  from_gc_block,
  from_hgc_block,
  from_hic_block,
  from_ms_clus,
  from_ms_emom,
  from_ms_block,
  from_se_block,
  from_ss_block,
  get_group_style
} from './factories'

import {
  insert_block,
  insert_cycles,
  insert_exercises,
  insert_user,
} from './db-utils'

export const get_block_type = block => {
  if (block.type === 'EN' && block.key === 'FBT') {
    return 'FBT'
  } else if (block.type === 'SS') {
    return 'MS'
  }

  return block.type as string
}

export const insert_mpyle = db =>
  insert_user(db, {
    username: 'mpyle',
    password: 'jester',
    email: 'mpyle101@gmail.com',
    first_name: 'Michael',
    last_name: 'Pyle'
  })

export const load_exercises = async db => {
  const exercises = await read_json('./exercises.json')
  const values = exercises.map(
    ({ key, name, unit: weight_unit }) => ({ key, name, weight_unit})
  )
  return insert_exercises(db, values)
}

export const load_cycles = async (db, user_id: string) => {
  const cycles = await read_json('./cycles.json')
  const values = cycles.map(({ name, start, end }) => ({
    name,
    user_id,
    start_date: start.$date.split('T')[0],
    end_date:   end.$date.split('T')[0]
  }))
  return insert_cycles(db, values)
}

export const read_json = (path: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    readFile(path, (err, data) =>
      err ? reject(err) : resolve(JSON.parse(data.toString()))
    )
  })


export function* get_set_groups(block_id: number, block) {
  let seqno = { value: 0 }
  switch (block.type) {
    case 'SS':
      yield from_ss_block(seqno, block_id, block)
      break
    case 'SE':
      yield from_se_block(seqno, block_id, block)
      break
    case 'GC':
      yield from_gc_block(seqno, block_id, block)
      break
    case 'HGC':
      yield from_hgc_block(seqno, block_id, block)
      break
    case 'HIC':
      yield from_hic_block(seqno, block_id, block)
      break
    case 'EN':
      if (block.key === 'FBT') {
        for (const work of block.actions) {
          yield from_ms_block(seqno, block_id, work)
        }
      } else {
        yield from_en_block(seqno, block_id, block)
      }
      break
    case 'MS':
      for (const work of block.work) {
        const style = get_group_style(work.style)
        switch (style) {
          case 'CLUS':
            yield from_ms_clus(seqno, block_id, work)
            break
          case 'EMOM':
            yield from_ms_emom(seqno, block_id, work)
            break
          default:
            yield from_ms_block(seqno, block_id, work)
            break
        }
      }
      break
    case 'OFF':
      return []
      break
    default:
      throw new Error(`Unknown block type: ${JSON.stringify(block)}`)
  }
}
