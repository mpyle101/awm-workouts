INSERT INTO awm.set (
    block_id,
    group_id,
    set_type,
    exercise,
    unit,
    weight,
    reps,
    period,
    notes,
    setno
)
VALUES (
    ${block_id},
    ${group_id},
    ${set_type},
    ${exercise},
    ${unit},
    ${weight},
    ${reps},
    ${period},
    ${notes},
    ${setno}
)
RETURNING id
