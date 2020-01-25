INSERT INTO awm.workout (workout_date, user_id, seqno)
VALUES (${date}, ${user_id}, ${seqno})
RETURNING id