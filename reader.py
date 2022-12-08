import csv, hashlib, json, sys, traceback
from datetime import date, timedelta
from collections import OrderedDict


def hash(s):
    return hashlib.md5(s.encode('utf-8')).hexdigest()


def process_reps(reps):
    set_style = 'STD'

    if reps[0] == '[':
        set_style = 'CLUS'
        reps = reps[1:-1].split('/')
        value = [int(x) for x in reps]
    else:
        reps = reps.split('/')
        if len(reps) > 1:
            set_style = 'SS'
            value = [int(x) for x in reps]
        else:
            reps = reps[0]
            if reps[-1] == 's' or reps[-1] == 'm':
                set_style = 'TIMED'
                value = 'PT' + reps.upper()
            else:
                value = int(reps)

    return value, set_style


def process_std(parts):
    wt = 0.0
    count = 1

    if len(parts) == 1:
        reps, set_style = process_reps(parts[0])

    elif len(parts) == 2:
        if parts[1] == 'M':
            count = int(parts[0])
            reps = None
            set_style = 'STD'
        else:
            wt = float(parts[0])
            reps, set_style = process_reps(parts[1])

    elif len(parts) == 3:
        wt = float(parts[1])
        count = int(parts[0])

        if parts[2] == 'M':
            reps = None
            set_style = 'STD'
        else:
            reps, set_style = process_reps(parts[2])

    return count, reps, wt, set_style


def process_emom(parts):
    style = 'EMOM'
    if len(parts) == 1:
        wt = 0.0
        reps, style = process_reps(parts[0])
        count = 1

    elif len(parts) == 2:
        wt = 0.0
        if parts[1] == 'M':
            count = int(parts[0])
            reps = None
        else:
            reps, style = process_reps(parts[1])
            count = int(parts[0])

    elif len(parts) == 3:
        wt = float(parts[1])
        reps, style = process_reps(parts[2])
        count = int(parts[0])

    return count, reps, wt, style


def process_bodyweight(parts):
    count, reps, wt, style = process_emom(parts)
    if style == 'EMOM': style = 'STD'
    return count, reps, wt, style


def process_timed(parts):
    wt = float(parts[0])
    reps = 'PT' + parts[1].upper()
    count = 1

    return count, reps, wt, 'TIMED'


def process_sets(details, func, unit, meta):
    sets = []
    last = None
    for s in details.split(','):
        s = s.strip()
        parts = s.split('x')
        if meta == 'EMOM':
            count, reps, wt, style = process_emom(parts)
            style = 'EMOM'
        else:
            count, reps, wt, style = func(parts)

        if meta == 'WAVE':
            style = 'WAVE'

        if last:
            if wt == last['wt'] and reps == last['reps']:
                last['count'] += count
            else:
                sets.append(last)
                last = {'wt': wt, 'unit': unit, 'reps': reps, 'count': count}
        else:
            last = {'wt': wt, 'unit': unit, 'reps': reps, 'count': count}
        if meta and meta not in ['EMOM', 'WAVE']:
            last['meta'] = meta

    sets.append(last)
    return sets, style


def process_MS(dt, mvmts):
    work = []
    for mvmt in mvmts:
        try:
            mvmt = mvmt.split(':')
            name = mvmt[0].strip().split(' ')
            key  = name[0]
            if len(name) > 1:
                meta = name[1][1:-1]
            else:
                meta = None 

            details = mvmt[1]
            func = legend[key]['func']
            unit = legend[key]['unit']
               
            sets, style = process_sets(details, func, unit, meta)
            work.append({'key': key, 'style': style, 'sets': sets})

        except:
            ex = sys.exc_info()[0]
            print(dt, mvmt)
            traceback.print_exc()

    return {'type': 'MS', 'work': work}


def process_SE(dt, mvmts):
    block = mvmts

    time = None
    objs = [dict() for i in mvmts]
    for idx, mvmt in enumerate(mvmts):
        if ':' in mvmt:
            try:
                mvmt = mvmt.split(':')
                name = mvmt[0].strip().split(' ')
                key  = name[0].upper()
                if len(name) > 1:
                    meta = name[1][1:-1]
                else:
                    meta = None 

                o = objs[idx]
                o['key']  = key
                o['unit'] = legend[key]['unit']
                o['meta'] = meta
                func = legend[key]['func']

                sets = []
                details = mvmt[1]
                for set in details.split(','):
                    set = set.strip()
                    parts = set.split('x')
                    count, reps, wt, style = func(parts)

                    for i in range(count):
                        sets.append({'reps': reps, 'wt': wt})

                o['sets']  = sets
                o['style'] = style

            except:
                ex = sys.exc_info()[0]
                print(dt, mvmts)
                print(idx, objs)
                traceback.print_exc()

        else:
            # overall time
            del objs[idx]
            time = 'PT' + mvmt.upper()

    sets = []
    for i in range(len(objs[0]['sets'])):
        b = []
        for o in objs:
            if i < len(o['sets']):
                s = o['sets'][i]
                b.append({
                    'key': o['key'],
                    'reps': s['reps'],
                    'wt': s['wt'],
                    'unit': o['unit'],
                    'style': o['style'],
                    'meta': o['meta']
                })

        sets.append(b)

    block = {'type': 'SE', 'sets': sets}
    if time: block['time'] = time

    return block


def process_SS(dt, mvmts):
    block = process_SE(dt, mvmts)
    block['type'] = 'SS'

    return block


def process_AS(dt, mvmts):
    block = mvmts

    time = None
    objs = [dict() for i in mvmts]
    for idx, mvmt in enumerate(mvmts):
        if ':' in mvmt:
            try:
                mvmt = mvmt.split(':')
                name = mvmt[0].strip().split(' ')
                key  = name[0].upper()
                if len(name) > 1:
                    meta = name[1][1:-1]
                else:
                    meta = None 

                o = objs[idx]
                o['key']  = key
                o['unit'] = legend[key]['unit']
                o['meta'] = meta
                func = legend[key]['func']

                sets = []
                details = mvmt[1]
                for set in details.split(','):
                    set = set.strip()
                    parts = set.split('x')
                    count, reps, wt, style = func(parts)

                    for i in range(count):
                        sets.append({'reps': reps, 'wt': wt})

                o['sets']  = sets
                o['style'] = style

            except:
                ex = sys.exc_info()[0]
                print(dt, mvmts)
                print(idx, objs)
                traceback.print_exc()

        else:
            # rest time
            del objs[idx]
            time = 'PT' + mvmt.upper()

    sets = []
    for i in range(len(objs[0]['sets'])):
        for o in objs:
            if i < len(o['sets']):
                s = o['sets'][i]
                sets.append({
                    'key': o['key'],
                    'reps': s['reps'],
                    'wt': s['wt'],
                    'unit': o['unit'],
                    'style': o['style'],
                    'meta': o['meta']
                })

    block = {'type': 'AS', 'sets': sets}
    if time: block['time'] = time

    return block


def process_GC(dt, mvmts):
    block = mvmts

    try:
        key   = mvmts[0]
        meta  = None
        notes = None

        if key == 'BIKE' or key == 'SKI':
            meta = mvmts[1]
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'
            if len(mvmts) > 3:
                notes = mvmts[3]

        elif key == 'ROW':
            k, v = mvmts[1].split(':')
            v = v.strip().upper()

            if k[0] == 'T':
                style = 'TIMED'
                work = 'PT' + v
            else:
                style = 'DIST'
                work = v

            if len(mvmts) > 2:
                notes = mvmts[2]
                
            meta = 'ROW'

        elif key == 'RUN':
            k, v = mvmts[1].split(':')
            meta = v.strip().upper()
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'
            if len(mvmts) > 3:
                notes = mvmts[3]
        else:
            print(dt, 'GC', mvmts)

        block = {'type': 'GC', 'key': key, 'style': style, 'work': work, 'notes': notes}
        if meta: block['meta'] = meta

    except:
        ex = sys.exc_info()[0]
        print(dt, mvmts)
        traceback.print_exc()

    return block


def process_HIC_GC(dt, mvmts):
    block = mvmts

    try:
        key = mvmts[0]
        meta = None

        if key == 'EMOM':
            style = 'EMOM'
            key, v = mvmts[1].split(':')
            func = legend[key]['func']
            unit = legend[key]['unit']
               
            work = []
            for s in v.split(','):
                s = s.strip()
                parts = s.split('x')
                count, reps, wt, set_style = process_emom(parts)

                for i in range(count):
                    work.append({'reps': reps, 'wt': wt, 'unit': unit, 'style': set_style})

        elif key == 'ROW':
            k, v = mvmts[1].split(':')
            v = v.strip().upper()

            if k[0] == 'T':
                style = 'TIMED'
                work = 'PT' + v
                meta = mvmts[2].upper()
            else:
                style = 'DIST'
                work = v
                meta = 'PT' + mvmts[2].upper()

        elif key == 'AS':
            style = 'TIMED'
            details = mvmts[1].split(' ')
            if len(details) > 1:
                reps = int(details[1][1:-1])
            else:
                reps = None

            parts = details[0].split('x')
            if len(parts) > 1:
                work = {'wt': float(parts[0]), 'time': 'PT' + parts[1].upper()}
            else:
                work = {'wt': 0.0, 'time': 'PT' + parts[0].upper()}
            if reps: work['reps'] = reps

        else:
            print(dt, 'HIC GC', mvmts)

        block = {'type': 'HGC', 'key': key, 'style': style, 'work': work}
        if meta: block['meta'] = meta

    except:
        ex = sys.exc_info()[0]
        print(dt, mvmts)
        traceback.print_exc()

    return block


def process_HIC(dt, mvmts):
    block = mvmts

    try:
        meta = None
        parts = mvmts[0].split(' ')
        key = parts[0].upper()
        if len(parts) > 1:
            meta = parts[1][1:-1]

        if key == 'ROW' or key == 'SIP':
            details = mvmts[1].split('x')
            work = []
            for i in range(int(details[0])):
                work.append({'reps': 'PT' + details[1].upper(), 'style': 'TIMED'})

            details = mvmts[2].split(':')
            rest = details[1].split('-')
            if len(rest) == 1:
                rest = 'PT' + rest[0].strip().upper()
            else:
                start = rest[0].strip() + 'M'
                end   = rest[1].upper()
                rest = 'PT' + start + '/PT' + end

            if len(mvmts) > 3:
                meta = mvmts[3].upper()

            block = {'type': 'HIC', 'key': 'INT', 'activity': key, 'work': work, 'rest': rest}
            if meta: block['meta'] = meta

        elif key == 'AMRAP':
            block = process_SE(dt, mvmts[1:])
            block['key']  = 'AMRAP'
            block['type'] = 'HIC'
            if meta: block['meta'] = 'PT' + meta.upper()

        elif key == 'TABATA':
            work = 'PT' + meta.upper()
            details = mvmts[1].split('x')
            key = details[0].upper()
            wt = float(details[1]) if len(details) > 1 else 0.0
            unit = legend[key]['unit']
            block = {'type': 'HIC', 'key': 'TAB', 'activity': key, 'work': work, 'wt': wt, 'unit': unit}

        elif key == 'CIRCUIT':
            block = process_SE(dt, mvmts[1:])
            block['key']  = 'CIR'
            block['type'] = 'HIC'
            if meta: block['meta'] = 'PT' + meta.upper()

        elif key == 'RUN':
            details = mvmts[1].split('x')
            work = []
            for i in range(int(details[0])):
                work.append({'reps': 'PT' + details[1].upper(), 'style': 'TIMED'})
            details = mvmts[2].split(':')
            rest = 'PT' + details[1].strip().upper()

            block = {'type': 'HIC', 'key': 'INT', 'activity': 'RUN', 'work': work, 'rest': rest}

        elif key == 'DESC':
            details = meta.split('@')
            reps = int(details[0])
            time = 'PT' + details[1].upper()

            work  = []
            mvmts = mvmts[1:]
            for i in range(reps, 0, -1):
                sets = []
                for m in mvmts:
                    details = m.split('x')
                    wt   = float(details[1]) if len(details) > 1 else 0.0
                    key  = details[0]
                    unit = legend[key]['unit']
                    sets.append({'key': key, 'reps': i, 'wt': wt, 'unit': unit, 'style': 'STD'})
                work.append(sets)

            block = {'type': 'HIC', 'key': 'CIR', 'sets': work, 'meta': time}

        else:
            print(dt, 'HIC', mvmts)

    except:
        ex = sys.exc_info()[0]
        print(dt, mvmts)
        traceback.print_exc()

    return block


def process_E(dt, mvmts):
    block = mvmts

    try:
        parts = mvmts[0].split(' ')
        key = parts[0].upper()
        if len(parts) > 1:
            style = parts[1][1:-1]
        else:
            style = None
        actions = []
        meta = None
        weight = 0.0
        wt_unit = 'BW'

        if key == 'LSD':
            sets = None
            meta = mvmts[1].upper()
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'
            if len(mvmts) > 3:
                notes = mvmts[3]

        elif key == 'FOBBIT':
            key  = 'FBT'
            meta = mvmts[1].upper()
            work = 'PT' + mvmts[-1].upper()

            sets = []
            for mvmt in mvmts[2:-1]:
                mvmt = mvmt.split(':')
                name = mvmt[0].strip().split(' ')
                skey = name[0]
                func = legend[skey]['func']
                unit = legend[skey]['unit']

                details = mvmt[1]
                sets, set_style = process_sets(details, func, unit, 'STD')
                actions.append({'key': skey, 'style': set_style, 'sets': sets})

        elif key == 'RUCK':
            wt = int(mvmts[1][:-1])
            work = 'PT' + mvmts[2].strip().upper()
            style = 'TIMED'
            weight = wt
            wt_unit = 'LB'
            if len(mvmts) > 3:
                meta = mvmts[3].upper()

        elif key == 'HIKE':
            work = 'PT' + mvmts[1].strip().upper()
            style = 'TIMED'
            if len(mvmts) > 2:
                meta = mvmts[2].upper()

        elif key == 'ROW':
            k, v = mvmts[1].split(':')
            v = v.strip().upper()

            if k[0] == 'T':
                style = 'TIMED'
                work = 'PT' + v
            else:
                style = 'DIST'
                work = v

        elif key == 'MISC':
            sets = None
            meta = mvmts[1].upper()
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'
            if len(mvmts) > 3:
                notes = mvmts[3]

        else:
            print(dt, 'E', mvmts)

        block = {
            'type': 'EN',
            'key': key,
            'work': work,
            'wt': weight,
            'unit': wt_unit
        }
        if meta: block['meta'] = meta
        if style: block['style'] = style
        if actions: block['actions'] = actions

    except:
        ex = sys.exc_info()[0]
        print(dt, mvmts)
        traceback.print_exc()

    return block


# #FBT (70m),TRNR,@SS,BBC: 4x25x10,TRE: 4x45x10,@MS,DBC/A: 4x30x12,TPD: 4x40x8
def process_FBT(dt, mvmts):
    actions = []
    key, rec = mvmts[0], mvmts[1:]
    while True:
        mt, rec = rec[0][1:], rec[1:]

        found = False
        for idx, item in enumerate(rec):
            if item.startswith('@'):
                found = True
                break

        if found:
            action, rec = rec[:idx], rec[idx:]
        else:
            action, rec = rec, None

        if mt == 'MS':      # Max Strength
            action = process_MS(dt, action)
        elif mt == 'SE':    # Strength Endurance
            action = process_SE(dt, action)
        elif mt == 'SS':    # Super Sets
            action = process_SS(dt, action)
        else:
            raise Exception('FBT Unknown Action: ', mt)
        actions.append(action)

        if rec is None: break
    
    block = {
        'type': 'FBT',
        'key': key,
        'wt': 0.0,
        'unit': 'BW',
        'style': 'MS',
        'actions': actions
    }

    return block


def process_OFF(dt, mvmts):
    if len(mvmts):
        return {'type': 'OFF', 'notes': mvmts[0]}
    else:
        return {'type': 'OFF'}


def process_record(dt, rec, unprocessed):
    workout = []
    block_num = 0

    while True:
        block_num += 1
        mt, rec = rec[0][1:], rec[1:]

        parts = mt.split(' ')
        key  = parts[0].upper()
        time = parts[1][1:-1] if len(parts) > 1 else None

        for idx, item in enumerate(rec):
            if item == '' or item.startswith('#'):
                break

        block, rec = rec[:idx], rec[idx:]
        if key == 'MS':      # Max Strength
            block = process_MS(dt, block)
        elif key == 'SE':    # Strength Endurance
            block = process_SE(dt, block)
        elif key == 'SS':    # Super Sets
            block = process_SS(dt, block)
        elif key == 'AS':    # Alternating Sets
            block = process_AS(dt, block)
        elif key == 'GC':    # General Conditioning
            block = process_GC(dt, block)
        elif key == 'E':     # Endurance
            block = process_E(dt, block)
        elif key == 'FBT':   # Fobbit
            block = process_FBT(dt, block)
            block['work'] = 'PT' + time.strip().upper()
        elif key == 'HGC':   # High Intensity General Conditioning
            block = process_HIC_GC(dt, block)
        elif key == 'HIC':   # High Intensity Conditioning
            block = process_HIC(dt, block)
        elif key == 'OFF':   # Off
            block = process_OFF(dt, block)
        else:
            unprocessed.add(key)

        if time and 'time' not in block: block['time'] = 'PT' + time.strip().upper()
        block['id'] = hash(dt + '/' + key + '/' + str(block_num))
        workout.append(block)
        if len(rec) == 0 or rec[0] == '':
            break

    return workout


def process_file(fname, workouts, cycles, unprocessed):
    with open(fname, newline='') as fp:
        count = 0
        reader = csv.reader(fp)
        for rec in reader:
            try:
                cycle   = rec[0]
                datestr = rec[1]
                dateobj = {'$date': datestr + 'T18:00:00.000Z'}

                if cycle != '':
                    if len(cycles):
                        cycle_end = date.fromisoformat(datestr) - timedelta(days=1)
                        cycle_end = {'$date': cycle_end.isoformat() + 'T18:00:00.000Z'}
                        last_cycle = cycles[-1]
                        last_cycle['end'] = cycle_end

                    cycles.append({
                        'name' : cycle,
                        'start': dateobj,
                    })

                record = rec[2:]
                blocks = process_record(datestr, record, unprocessed)
                count += 1
                rec_csv = ','.join(record).rstrip(',')
                if datestr in workouts:
                    workouts[datestr]['row'].append(count)
                    workouts[datestr]['csv'] += f'\n{rec_csv}'
                    workouts[datestr]['blocks'].append({'type': 'BR'})
                    workouts[datestr]['blocks'] += blocks
                else:
                    workouts[datestr] = {
                        'row'   : [count],
                        'csv'   : rec_csv,
                        'date'  : dateobj,
                        'type'  : blocks[0]['type'],
                        'blocks': blocks
                    }
            except:
                ex = sys.exc_info()[0]
                print('Processing', fname)
                print(rec)
                traceback.print_exc()
    
    return count


legend = {}
with open('/space/awm-data/legend.csv', newline='') as fp:
    reader = csv.reader(fp)
    for rec in reader:
        legend[rec[0]] = {'key': rec[0], 'name': rec[1], 'unit': rec[2], 'func': process_std}

legend['IRR']['func']    = process_bodyweight
legend['DH']['func']     = process_timed
legend['KBW/1']['func']  = process_timed
legend['KBW/2']['func']  = process_timed
legend['DBFW/2']['func'] = process_timed
legend['MBPS']['func']   = process_bodyweight
legend['PS']['func']     = process_bodyweight
legend['REST']['func']   = process_bodyweight
legend['SRR']['func']    = process_bodyweight
legend['SU']['func']     = process_bodyweight

cycles = []
workouts = OrderedDict()
unprocessed = set()
count = process_file('/space/awm-data/workouts.csv', workouts, cycles, unprocessed)

last_cycle = cycles[-1]
cycle_end  = {'$date': date.today().isoformat() + 'T18:00:00.000Z'}
last_cycle['end'] = cycle_end

with open('/space/awm-data/workouts.json', 'w') as fp:
    json.dump(list(workouts.values()), fp, indent=4)

with open('/space/awm-data/exercises.json', 'w') as fp:
    values = list(legend.values())
    for el in values:
        del el['func']
    json.dump(values, fp, indent=4)

with open('/space/awm-data/cycles.json', 'w') as fp:
    json.dump(cycles, fp, indent=4)

if len(unprocessed) > 0:
    print(unprocessed)

print(f'{count} processed')
