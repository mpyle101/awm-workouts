import { sql, DatabasePoolType } from 'slonik'

export const truncate_all = (db: DatabasePoolType) => {
    return db.query(sql`
        TRUNCATE
            awm.standard_set,
            awm.timed_set,
            awm.distance_set,
            awm.set,
            awm.set_group,
            awm.fbt_block,
            awm.hic_block,
            awm.block,
            awm.workout,
            awm.exercise,
            awm.user
        `)
}
