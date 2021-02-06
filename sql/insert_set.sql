INSERT INTO awm.set (
    user_id,
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
    ${user_id},
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
