import { readFileSync } from 'fs'
import { join } from 'path'
import { Database as SQLITE, Statement } from 'better-sqlite3'

const sqlite = require('better-sqlite3')

type Statements = {
    truncate_all: () => void;
    insert_user: Statement;
    insert_block: Statement;
    insert_cycle: Statement;
    insert_exercise: Statement;
    insert_fbt_block: Statement;
    insert_hic_block: Statement;
    insert_se_block: Statement;
    insert_set: Statement;
    insert_set_group: Statement;
    insert_workout: Statement;
}

export type Database = SQLITE & Statements;

const load_sql = (fname: string) => {
    const path = join(__dirname, 'sql', fname)
    const sql  = readFileSync(path, 'utf-8')
    return sql.replace(/\s+/g, ' ')
}

export const open_db = (path: string) => {
    const db: Database = new sqlite(path)

    db.truncate_all     = () => db.exec(load_sql('truncate_all.sql'))
    db.insert_user      = db.prepare(load_sql('insert_user.sql'))
    db.insert_block     = db.prepare(load_sql('insert_block.sql'))
    db.insert_cycle     = db.prepare(load_sql('insert_cycle.sql'))
    db.insert_exercise  = db.prepare(load_sql('insert_exercise.sql'))
    db.insert_fbt_block = db.prepare(load_sql('insert_fbt_block.sql'))
    db.insert_hic_block = db.prepare(load_sql('insert_hic_block.sql'))
    db.insert_se_block  = db.prepare(load_sql('insert_se_block.sql'))
    db.insert_set       = db.prepare(load_sql('insert_set.sql'))
    db.insert_set_group = db.prepare(load_sql('insert_set_group.sql'))
    db.insert_workout   = db.prepare(load_sql('insert_workout.sql'))

    return db
}

export const truncate_all = (db: Database) =>
    db.truncate_all()

export const insert_user = (db: Database, user) =>
    db.insert_user.get(user).id

export const insert_workout = (
    db: Database,
    user_id: number,
    seqno: number,
    workout_date: string,
    csv: string,
) =>
    db.insert_workout.get({user_id, workout_date, seqno, csv}).id


export const insert_block = (
    db: Database,
    user_id: number,
    workout_id: number,
    seqno: number,
    block_type: string,
    duration: string,
    notes: string
) =>
    db.insert_block.get({user_id, workout_id, block_type, seqno, duration, notes}).id

export const insert_fbt_block = (
    db: Database,
    user_id: number,
    block_id: number,
    exercise: string,
    block: any
) => {
    const style = block.style
    const duration = block.work
    db.insert_fbt_block.run({user_id, exercise, style, duration, id: block_id})
}

export const insert_se_block = (
    db: Database,
    user_id: number,
    block_id: number,
    block: any
) => {
    const duration = block.time
    db.insert_se_block.run({user_id, duration, id: block_id})
}

export const insert_hic_block = (
    db: Database,
    user_id: number,
    block_id: number,
    block: any
) => {
    const style = block.key

    let duration = null
    let distance = null

    if (style === 'TAB') {
        duration = block.work
    } else if (style === 'CIR' || style === 'AMRAP') {
        duration = block.meta
    } else if (style === 'INT') {
        duration = block.rest
        distance = block.meta
    }

    db.insert_hic_block.run({user_id, style, duration, distance, id: block_id})
}


interface ISetGroup {
    user_id: number,
    block_id: number
    style: string
    seqno: number
}
export const insert_set_group = (db: Database, sg: ISetGroup) => 
    db.insert_set_group.get(sg).id

export const insert_set_groups = (db: Database, values: Array<ISetGroup>) => {
    const trx = db.transaction(data => data.map(v => db.insert_set_group.get(v).id))
    return trx(values)
}


interface IWorkoutSet {
    user_id: number
    block_id: number
    group_id: number
    exercise: string
    weight_unit: string
    weight: number
    set_type: string
    notes: string
    setno: number
    reps: number
    duration: string
    distance: string
}
export const insert_sets = (db: Database, values: Array<IWorkoutSet>) => {
    const trx = db.transaction(data => data.map(v => db.insert_set.get(v).id))
    trx(values)
}


interface IExercise {
    key: string
    name: string
    weight_unit: string
}
export const insert_exercises = (db: Database, values: Array<IExercise>) => {
    const trx = db.transaction(data => data.forEach(v => db.insert_exercise.run(v)))
    trx(values)
}

interface ICycle {
    user_id: number
    name: string
    start_date: string
    end_date: string
}
export const insert_cycles = (db: Database, values: Array<ICycle>) => {
    const trx = db.transaction(data => data.forEach(v => db.insert_cycle.run(v)))
    trx(values)
}
