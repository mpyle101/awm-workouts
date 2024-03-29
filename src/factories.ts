import { range } from './utils'

const get_set_type = style => 
  style === 'TIMED' ? 'TMD' : style === 'DIST' ? 'DST' : 'STD'


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
    notes: set.meta as string || '',
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
  seqno: number
) => ({ block_id, style, seqno })


export const get_group_style = style => 
  style === 'TIMED' ? 'STD' : style as string


export const from_ms_block = (seqno, block_id, block) => {
  const style = get_group_style(block.sets[0].style)
  if (style == 'CLUS') {
    return from_ms_clus(seqno, block_id, block)
  }

  seqno.value += 1
  const group = create_set_group(block_id, style, seqno.value)

  let setno = 0;
  const sets = block.sets.map(set => {
    setno += 1
    return create_set_record(block_id, get_set_type(set.style), set.key, set, setno)
  })

  return [{ group, sets }]
}

export const from_ms_clus = (seqno, block_id, block) =>
  block.sets.reduce((acc, set) => {
    seqno.value += 1

    let setno = 0
    const sets = set.reps.map(reps => {
      setno += 1
      const rec = create_set_record(block_id, 'STD', set.key, set, setno)
      return { ...rec, reps }
    })

    const group = create_set_group(block_id, 'CLUS', seqno.value)
    acc.push({ group, sets })
    return acc
  }, [])


export const from_as_block = (seqno, block_id, block) => {
  seqno.value += 1
  const group = create_set_group(block_id, 'AS', seqno.value)

  let setno = 0;
  const sets = block.sets.map(set => {
    setno += 1
    return create_set_record(block_id, get_set_type(set.style), set.key, set, setno)
  })

  return [{ group, sets }]
}


export const from_ss_block = (seqno, block_id, block) =>
  block.sets.reduce((acc, arr) => {
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
    const group = create_set_group(block_id, 'STD', seqno.value)
    const rec = { ...first, reps: block.time }
    const set = create_set_record(block_id, 'TMD', rec.key, rec, 1)
    set.reps = first.reps

    return [{ group, sets: [set] }]
  }

  return from_ss_block(seqno, block_id, block)
}


const GC_EXER = new Map([
  ['ROWROW',   'ROW'],
  ['BIKECX',   'BIKE/CX'],
  ['BIKEGRVL', 'BIKE/GR'],
  ['BIKEMTN',  'BIKE/MT'],
  ['BIKEROAD', 'BIKE/RD'],
  ['BIKESS',   'BIKE/SS'],
  ['BIKETRNR', 'TRNR'],
  ['SKICX',    'SKI/CX']
])
const get_gc_exercise = block =>
  block.key === 'RUN'
    ? 'RUN'
    : GC_EXER.get(block.key + block.meta) || 'NONE'


export const from_gc_block = (seqno, block_id, block) => {
  const exercise = get_gc_exercise(block)
  const set_type = get_set_type(block.style)
  const rec = { reps: block.work, meta: null }
  if (exercise === 'RUN') rec.meta = block.meta
  const set = create_set_record(block_id, set_type, exercise, rec, 1)

  seqno.value += 1
  const group = create_set_group(block_id, 'STD', seqno.value)

  return [{ group, sets: [set] }]
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

  seqno.value += 1
  const group = create_set_group(block_id, 'STD', seqno.value)

  return [{ group, sets: [set] }]
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

  seqno.value += 1
  const group = create_set_group(block_id, 'STD', seqno.value)

  return [{ group, sets: [set] }]
}


export const from_hic_block = (seqno, block_id, block) => {
  const style = block.key
  if (style === 'TAB') {
    seqno.value += 1
    const group = create_set_group(block_id, 'STD', seqno.value)
  
    const exercise = block.activity
    const rec = { wt: block.wt, unit: block.unit, reps: block.work }
    const set = create_set_record(block_id, 'TMD', exercise, rec, 1)
    if (exercise === 'MBRT') set.weight = 14
    return [{ group, sets: [set] }]

  } else if (style === 'CIR' || style === 'AMRAP' ) {
    return from_ss_block(seqno, block_id, block)

  } else if (style === 'INT') {
    seqno.value += 1
    const group = create_set_group(block_id, 'SS', seqno.value)
    const exercise = block.activity
    const sets = block.work.map((set, idx) =>
      create_set_record(block_id, 'TMD', exercise, { reps: set.reps }, idx + 1)
    )
    return [{ group, sets }]
  }

  return []
}