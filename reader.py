import csv, json, sys, traceback
from datetime import date, timedelta
from collections import OrderedDict

def process_reps(reps):
    set_style = 'STD'

    if reps[0] == '[':
        set_style = 'CLUS'
        reps = reps[1:-1].split('/')
        value = [int(x) for x in reps]
    else:
        reps = reps.split('/')
        if len(reps) > 1:
            set_style = 'SUPER'
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
            reps = -1
            set_style = 'STD'
        else:
            wt = float(parts[0])
            reps, set_style = process_reps(parts[1])

    elif len(parts) == 3:
        wt = float(parts[1])
        count = int(parts[0])

        if parts[2] == 'M':
            reps = -1
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
            reps = -1
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
    return count, reps, wt, 'STD'


def process_timed(parts):
    wt = float(parts[0])
    reps = 'PT' + parts[1].upper()
    count = 1

    return count, reps, wt, 'TIMED'


def process_MS(dt, mvmts):
    sets = []
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
               
            for s in details.split(','):
                s = s.strip()
                parts = s.split('x')
                if meta == 'EMOM':
                    count, reps, wt, style = process_emom(parts)
                    style = 'EMOM'
                else:
                    count, reps, wt, style = func(parts)

                for i in range(count):
                    sets.append({'key': key, 'reps': reps, 'wt': wt, 'unit': unit, 'style': style, 'meta': meta})

        except:
            ex = sys.exc_info()[0]
            print(dt, mvmt)
            traceback.print_exc()

    return {'type': 'MS', 'sets': sets}


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

                o = objs[idx]
                o['key'] = key
                o['unit'] = legend[key]['unit']
                func = legend[key]['func']

                sets = []
                details = mvmt[1]
                for set in details.split(','):
                    set = set.strip()
                    parts = set.split('x')
                    count, reps, wt, style = func(parts)

                    for i in range(count):
                        sets.append({'reps': reps, 'wt': wt})

                o['sets'] = sets
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
                b.append({'key': o['key'], 'reps': s['reps'], 'wt': s['wt'], 'unit': o['unit'], 'style': o['style']})

        sets.append(b)

    block = {'type': 'SE', 'sets': sets}
    if time: block['time'] = time

    return block


def process_SS(dt, mvmts):
    block = process_SE(dt, mvmts)
    block['type'] = 'SS'

    return block


def process_GC(dt, mvmts):
    block = mvmts

    try:
        key = mvmts[0]
        meta = None
        comment = None

        if key == 'BIKE':
            meta = mvmts[1]
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'
            if len(mvmts) > 3:
                comment = mvmts[3]

        elif key == 'ROW':
            k, v = mvmts[1].split(':')
            v = v.strip().upper()

            if k[0] == 'T':
                style = 'TIMED'
                work = 'PT' + v
            else:
                style = 'DIST'
                work = v

            meta = 'ROW'

        elif key == 'RUN':
            k, v = mvmts[1].split(':')
            meta = v.strip().upper()
            work = 'PT' + mvmts[2]
            style = 'TIMED'
            if len(mvmts) > 3:
                comment = mvmts[3]
        else:
            print(dt, 'GC', mvmts)

        block = {'type': 'GC', 'key': key, 'style': style, 'work': work, 'comment': comment}
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

        if key == 'ROW':
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

            block = {'type': 'HIC', 'key': key, 'style': 'INT', 'work': work, 'rest': rest}
            if meta: block['meta'] = meta

        elif key == 'AMRAP':
            block = process_SE(dt, mvmts[1:])
            block['type'] = 'HIC'
            block['style'] = 'AMRAP'
            if meta: block['time'] = 'PT' + meta.upper()

        elif key == 'TABATA':
            work, meta = 'PT' + meta.upper(), None
            details = mvmts[1].split('x')
            key = details[0].upper()
            wt = float(details[1]) if len(details) > 1 else 0.0
            unit = legend[key]['unit']

            block = {'type': 'HIC', 'key': key, 'style': 'TAB', 'work': work, 'wt': wt, 'unit': unit}

        elif key == 'RNDS':
            block = process_SE(dt, mvmts[1:])
            block['type'] = 'HIC'
            block['style'] = 'CIRCUIT'
            if meta: block['time'] = 'PT' + meta.upper()

        elif key == 'RUN':
            details = mvmts[1].split('x')
            work = []
            for i in range(int(details[0])):
                work.append({'reps': 'PT' + details[1].upper(), 'style': 'TIMED'})
            details = mvmts[2].split(':')
            rest = 'PT' + details[1].strip().upper()

            block = {'type': 'HIC', 'key': key, 'style': 'INT', 'work': work, 'meta': meta, 'rest': rest}

        elif key == 'TRNR':
            time = meta = 'PT' + meta.upper()
            details = mvmts[1].split('x')
            work = []
            for i in range(int(details[0])):
                work.append({'reps': 'PT' + details[1].upper(), 'style': 'TIMED'})

            block = {'type': 'HIC', 'key': key, 'style': 'INT', 'work': work, 'time': time}

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

            block = {'type': 'HIC', 'style': 'CIR', 'work': work, 'time': time}

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
        key = mvmts[0]
        sets = []

        if key == 'LSD':
            sets = None
            meta = mvmts[1].upper()
            work = 'PT' + mvmts[2].upper()
            style = 'TIMED'

        elif key == 'FOBBIT':
            key  = 'FBT'
            meta = mvmts[1]
            work = 'PT' + mvmts[-1].upper()
            style = 'TIMED'

            sets = []
            for mvmt in mvmts[2:-1]:
                mvmt = mvmt.split(':')
                name = mvmt[0].strip().split(' ')
                skey = name[0]
                unit = legend[skey]['unit']

                details = mvmt[1]
                for s in details.split(','):
                    s = s.strip()
                    parts = s.split('x')
                    count, reps, wt, style = process_std(parts)

                    for i in range(count):
                        sets.append({'key': skey, 'reps': reps, 'wt': wt, 'unit': unit, 'style': style})

        elif key == 'RUCK':
            wt = int(mvmts[1][:-1])
            k, v = mvmts[2].split(':')
            work = 'D' + v.strip().upper()
            style = 'DIST'
            meta = {'wt': wt, 'unit': 'LB'}
            if len(mvmts) > 3:
                meta['time'] = 'PT' + mvmts[3].upper()

        elif key == 'ROW':
            meta = None
            k, v = mvmts[1].split(':')
            v = v.strip().upper()

            if k[0] == 'T':
                style = 'TIMED'
                work = 'PT' + v
            else:
                style = 'DIST'
                work = 'D' + v

        else:
            print(dt, 'E', mvmts)

        block = {'type': 'EN', 'key': key, 'style': style, 'work': work}
        if meta: block['meta'] = meta
        if sets: block['sets'] = sets

    except:
        ex = sys.exc_info()[0]
        print(dt, mvmts)
        traceback.print_exc()

    return block


def process_OFF(dt, mvmts):
    if len(mvmts):
        return {'type': 'OFF', 'comment': mvmts[0]}
    else:
        return {'type': 'OFF'}


def process_record(dt, rec, unprocessed):
    workout = []
    
    while True:
        mt, rec = rec[0][1:], rec[1:]
        for idx, item in enumerate(rec):
            if item == '' or item.startswith('#'):
                break

        blocks, rec = rec[:idx], rec[idx:]
        if mt == 'MS':
            blocks = process_MS(dt, blocks)
        elif mt == 'SE':
            blocks = process_SE(dt, blocks)
        elif mt == 'SS':
            blocks = process_SS(dt, blocks)
        elif mt == 'GC':
            blocks = process_GC(dt, blocks)
        elif mt == 'E':
            blocks = process_E(dt, blocks)
        elif mt == 'OFF':
            blocks = process_OFF(dt, blocks)
        elif mt == 'HIC GC':
            blocks = process_HIC_GC(dt, blocks)
        elif mt == 'HIC':
            blocks = process_HIC(dt, blocks)
        else:
            unprocessed.add(mt)

        workout.append(blocks)
        if len(rec) == 0 or rec[0] == '':
            break

    return workout


def process_file(fname, workouts, cycles, unprocessed):
    with open(fname, newline='') as fp:
        reader = csv.reader(fp)
        for rec in reader:
            cycle = rec[0]

            datestr = rec[1]
            dateobj = {'$date': datestr + 'T12:00:00-0600'}

            if cycle != '':
                if len(cycles):
                    cycle_end = date.fromisoformat(datestr) - timedelta(days=1)
                    cycle_end = {'$date': cycle_end.isoformat() + 'T12:00:00-0600'}
                    last_cycle = cycles[-1]
                    last_cycle['end'] = cycle_end

                cycles.append({
                    'name' : cycle,
                    'start': dateobj,
                })


            blocks  = process_record(datestr, rec[2:], unprocessed)
            if datestr in workouts:
                workouts[datestr]['blocks'].append({'type': 'BR'})
                workouts[datestr]['blocks'] += blocks
            else:
                workouts[datestr] = {
                    'date'  : dateobj,
                    'type'  : blocks[0]['type'],
                    'blocks': blocks
                }


legend = {}
with open('Legend.csv', newline='') as fp:
    reader = csv.reader(fp)
    for rec in reader:
        legend[rec[0]] = {'key': rec[0], 'name': rec[1], 'unit': rec[2], 'func': process_std}

legend['IRR']['func']   = process_bodyweight
legend['KBW/1']['func'] = process_timed
legend['KBW/2']['func'] = process_timed
legend['MBPS']['func']  = process_bodyweight
legend['MBRT']['func']  = process_bodyweight
legend['PS']['func']    = process_bodyweight
legend['REST']['func']  = process_bodyweight
legend['SRR']['func']   = process_bodyweight
legend['SU']['func']    = process_bodyweight

cycles = []
workouts = OrderedDict()
unprocessed = set()
process_file('Workouts-old.csv', workouts, cycles, unprocessed)
process_file('Workouts.csv', workouts, cycles, unprocessed)

last_cycle = cycles[-1]
cycle_end  = {'$date': date.today().isoformat() + 'T12:00:00-0600'}
last_cycle['end'] = cycle_end

with open('workouts.json', 'w') as fp:
    json.dump(list(workouts.values()), fp, indent=4)

with open('exercises.json', 'w') as fp:
    values = list(legend.values())
    for el in values:
        del el['func']
    json.dump(values, fp, indent=4)

with open('cycles.json', 'w') as fp:
    json.dump(cycles, fp, indent=4)

if len(unprocessed) > 0:
    print(unprocessed)


