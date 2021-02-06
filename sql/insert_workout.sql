INSERT INTO awm.workout (user_id, workout_date, seqno)
VALUES (${user_id}, ${date}, ${seqno})
RETURNING id