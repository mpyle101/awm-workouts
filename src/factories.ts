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

const get_set_type = style => style === 'TIMED' ? 'TMD' : 'STD'
export const get_group_style = style => style === 'TIMED' ? 'STD' : style as string

export const from_ms_block = (seqno, block_id, work) => {
  seqno.value += 1
  const style = get_group_style(work.style)
  const group = { block_id, style, seqno: seqno.value, interval: null }
  const set_type = get_set_type(work.style)

  let setno = 0
  const sets = work.sets.reduce((acc, set) => {
    const rec = create_set_record(block_id, set_type, work.key, set)
    for (let i = 0; i < set.count; i++) {
      setno += 1
      acc.push({ ...rec, setno })
    }
    return acc
  }, [])

  return [{ group, sets }]
}

export const from_ms_clus = (seqno, block_id, work) =>
  work.sets.reduce((acc, set) => {
    let setno = 0
    const sets = set.reps.map(reps => {
      setno += 1
      const rec = create_set_record(block_id, 'STD', work.key, set, setno)
      return { ...rec, reps }
    })

    for (let i = 0; i < set.count; i++) {
      seqno.value += 1
      const group = { block_id, style: 'CLUS', seqno: seqno.value, interval: null }
      acc.push({ group, sets })
    }

    return acc
  }, [])


export const from_ms_emom = (seqno, block_id, work) => {
  seqno.value += 1
  const style = 'EMOM'
  const group = { block_id, style, seqno: seqno.value, interval: null }
  const set_type = get_set_type(work.style)

  let setno = 0
  const sets = work.sets.reduce((acc, set) => {
    const rec = create_set_record(block_id, set_type, work.key, set)
    for (let i = 0; i < set.count; i++) {
      setno += 1
      acc.push({ ...rec, setno })
    }
    return acc
  }, [])

  return [{ group, sets }]
}

export const from_ss_block = (seqno, block_id, work) =>
  work.reduce((acc, arr) => {
    seqno.value += 1
    let setno = 0
    const group = { block_id, style: 'SS', seqno: seqno.value, interval: null }
    const sets = arr.map(set => {
      setno += 1
      return create_set_record(block_id, get_set_type(set.style), set.key, set, setno)
    })
    acc.push({ group, sets })
    return acc
  }, [])


const GC_EXER = new Map([
  ['ROWROW', 'ROW'],
  ['BIKECX', 'BIKE/CX'],
  ['BIKEGRVL', 'BIKE/GR'],
  ['BIKEROAD', 'BIKE/RD'],
  ['BIKESS', 'BIKE/SS'],
  ['BIKETRNR', 'TRNR'],
  ['SKICX', 'SKI/CX']
])
const get_gc_exercise = block => {
  if (block.key === 'RUN') {
    return 'RUN'
  }
  return GC_EXER.get(block.key + block.meta) || 'NONE'
}

export const from_gc_block = (seqno, block_id, block) => {
  const exercise = get_gc_exercise(block)
  const set_type = get_set_type(block.style)
  const rec = { unit: 'BW', wt: 0, reps: block.work, meta: null }
  if (exercise === 'RUN') rec.meta = block.meta
  const set = create_set_record(block_id, set_type, exercise, rec, 1)
  return [{ sets: [set] }]
}
