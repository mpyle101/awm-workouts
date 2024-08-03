import { readFileSync } from 'fs'
import { Database } from './db-utils'
import {
  create_set_record,
  from_as_block,
  from_en_block,
  from_gc_block,
  from_hgc_block,
  from_hic_block,
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

import { CYCLES, EXERCISES } from './consts'

export const range = (size: number) => [...Array(size).keys()]

export const get_block_type = block => {
  if (block.type === 'EN' && block.key === 'FBT') {
    return 'FBT'
  } else if (block.type === 'SS' || block.type === 'AS') {
    return 'MS'
  }

  return block.type as string
}

export const insert_mpyle = (db: Database) =>
  insert_user(db, {
    username: 'mpyle',
    password: 'jester',
    email: 'mpyle101@gmail.com',
    first_name: 'Michael',
    last_name: 'Pyle'
  })
  
export const load_exercises = (db: Database) => {
  const exercises = read_json(EXERCISES)
  const values = exercises.map(
    ({ key, name, unit: weight_unit }) => ({ key, name, weight_unit })
  )
  return insert_exercises(db, values)
}

export const load_cycles = async (db: Database, user_id: number) => {
  const cycles = await read_json(CYCLES)
  const values = cycles.map(({ name, start, end }) => ({
    name,
    user_id,
    start_date: start.$date.split('T')[0],
    end_date:   end.$date.split('T')[0]
  }))
  return insert_cycles(db, values)
}

export const read_json = (path: string) => {
  const data = readFileSync(path)
  return JSON.parse(data.toString())
}

export function* get_set_groups(block_id: number, block) {
  let seqno = { value: 0 }
  switch (block.type) {
    case 'AS':
      yield from_as_block(seqno, block_id, block)
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
    case 'MS':
      yield from_ms_block(seqno, block_id, block)
      break
    case 'SE':
      yield from_se_block(seqno, block_id, block)
      break
    case 'SS':
      yield from_ss_block(seqno, block_id, block)
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
    case 'FBT':
      for (const action of block.actions) {
        switch(action.type) {
          case 'SE':
            yield from_se_block(seqno, block_id, action)
            break
          case 'SS':
            yield from_ss_block(seqno, block_id, action)
            break
          default:
            yield from_ms_block(seqno, block_id, action)
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
