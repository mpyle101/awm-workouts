INSERT INTO awm.set (
    block_id,
    group_id,
    set_type,
    exercise,
    unit,
    weight,
    reps,
    duration,
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
    ${duration},
    ${notes},
    ${setno}
)
RETURNING id
