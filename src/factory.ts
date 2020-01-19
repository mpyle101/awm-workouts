export const create_set_record = (
    block_id: number,
    set_type: string,
    exercise: string,
    set: any
) => ({
    block_id,
    set_type,
    exercise,
    unit: set.unit as string,
    notes: set.meta as string || null,
    setno: 0,
    weight: set.wt as number,
    reps: null,
    period: null
})
