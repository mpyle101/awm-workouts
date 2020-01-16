import { createReadStream } from 'fs'
import { parse } from 'JSONStream'
import { createPool, sql, DatabasePoolType } from 'slonik'

import { truncate_all } from './db-utils'

const load_workouts = (path, cb) => {
    const parser = parse('*')
    const pipeline = createReadStream(path).pipe(parser)
    pipeline.on('data', data => cb(data))
}

const main = async () => {
    const db = createPool('postgres://jester@localhost/awm')
    await truncate_all(db)
    load_workouts('./workouts.json', workout => console.log(workout))
    await db.end()
}

main()