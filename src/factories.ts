const get_set_type = style => style === 'TIMED' ? 'TMD' : style === 'DIST' ? 'DST' : 'STD'

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
    unit: set.unit as string || 'BW',
    notes: set.meta as string || null,
    weight: set.wt as number || 0,
    reps: null,
    duration: null,
    distance: null
  }

  if (set_type === 'STD') {
    rec.reps = set.reps
  } else if (set_type === 'TMD') {
    rec.duration = set.reps
  }

  return rec
}

const create_set_group = (
  block_id: number,
  style: string,
  seqno: number,
  duration: string | null = null
) => ({ block_id, style, seqno, duration })


export const get_group_style = style => style === 'TIMED' ? 'STD' : style as string

export const from_ms_block = (seqno, block_id, work) => {
  seqno.value += 1
  const style = get_group_style(work.style)
  const group = create_set_group(block_id, style, seqno.value)
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
      const group = create_set_group(block_id, 'CLUS', seqno.value)
      acc.push({ group, sets })
    }

    return acc
  }, [])


export const from_ms_emom = (seqno, block_id, work) => {
  seqno.value += 1
  const style = 'EMOM'
  const group = create_set_group(block_id, style, seqno.value)
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
    const group = create_set_group(block_id, 'SS', seqno.value)
    const sets = arr.map(set => {
      setno += 1
      return create_set_record(block_id, get_set_type(set.style), set.key, set, setno)
    })
    acc.push({ group, sets })
    return acc
  }, [])


export const from_se_block = (seqno, block_id, block) => {
  const first = block.sets[0][0]
  if (first.key === 'AS') {
    // Air Squats are timed
    seqno.value += 1
    const group = create_set_group(block_id, 'STD', seqno.value, block.time)
    const rec = { ...first, reps: block.time }
    const set = create_set_record(block_id, 'TMD', rec.key, rec, 1)
    set.reps = first.reps
    return [{ group, sets: [set] }]
  }

  return from_ss_block(seqno, block_id, block.sets)
}


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
  const rec = { reps: block.work, meta: null }
  if (exercise === 'RUN') rec.meta = block.meta
  const set = create_set_record(block_id, set_type, exercise, rec, 1)
  return [{ sets: [set] }]
}


export const from_en_block = (seqno, block_id, block) => {
  const meta     = block.key === 'LSD' ? null : block.meta
  const exercise = block.key === 'LSD' ? 'TRNR' : block.key
  const set_type = get_set_type(block.style)
  const set = create_set_record(block_id, set_type, exercise, { meta }, 1)
  if (set_type === 'TMD') {
    set.duration = block.work
  } else {
    set.distance = block.work
  }

  return [{ sets: [set] }]
}


export const from_hgc_block = (seqno, block_id, block) => {
  const exercise = block.key
  const set_type = get_set_type(block.style)
  const set = create_set_record(block_id, set_type, exercise, {}, 1)
  if (set_type === 'TMD') {
    set.duration = block.work
    set.distance = block.meta
  } else {
    set.duration = block.meta
    set.distance = block.work
  }

  return [{ sets: [set] }]
}
