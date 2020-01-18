INSERT INTO awm.workout (date, user_id, seqno)
VALUES (${date}, ${user_id}, ${seqno})
RETURNING id