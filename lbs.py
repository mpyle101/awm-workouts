import csv, json, sys
from datetime import datetime

def process(parts):
    mvmt = parts[0] + ': '
    
    lb_sets = parts[1].split(',')
    for set in lb_sets:
        d = set.split('x')
        wt = round(float(d[0]) / 2.2)
        reps = d[1]
        mvmt += str(wt) + 'x' + d[1] + ', '

    return mvmt


mvmts = []
with open('lbs.csv', newline='') as fp:
    reader = csv.reader(fp)
    for rec in reader:
        if rec[0] != '':
            parts = rec[0].split(':')
            mvmts.append(process(parts))

        if rec[1] != '':
            print(rec[1])
            parts = rec[1].split(':')
            mvmts.append(process(parts))


with open('kgs.txt', 'w') as fp:
    for mvmt in mvmts:
        fp.write(mvmt[:-2])
        fp.write('\n')