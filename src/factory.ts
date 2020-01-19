export const create_set_record = (
    block_id: number,
    set_type: string,
    exercise: string,
    set: any,
    setno = 0
) => {
  const rec = {
    setno,
    block_id,
    set_type,
    exercise,
    unit: set.unit as string,
    notes: set.meta as string || null,
    weight: set.wt as number,
    reps: null,
    period: null
  }

  if (set_type === 'STD') {
    rec.reps = set.reps
  } else {
    rec.period = set.reps
  }

  return rec
}


