import { createReadStream } from 'fs'
import { parse } from 'JSONStream'
import { Database } from './dbutils'

import {
  insert_block,
  insert_cycle,
  insert_exercise,
  insert_user,
} from './dbutils'

export const get_block_type = block => {
  if (block.type === 'EN' && block.key === 'FBT') {
    return 'FBT'
  } else if (block.type = 'SS') {
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

export const load_exercises =  async db =>
  await read_json('./exercises.json', async rec =>
    await insert_exercise(db, rec)
  )

export const load_cycles = async db =>
  await read_json('./cycles.json', async rec => {
    const start = rec.start.$date.split('T')[0]
    const end   = rec.end.$date.split('T')[0]
    await insert_cycle(db, rec.name, start, end)
  })

export const read_json = (path: string, cb) =>
  new Promise(resolve => {
    const parser = parse('*')
    const pipeline = createReadStream(path).pipe(parser)
    pipeline.on('data', data => cb(data))
    pipeline.on('end', () => resolve())
  })
