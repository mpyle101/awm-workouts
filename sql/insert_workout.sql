INSERT INTO awm.workout (user_id, workout_date, seqno, csv)
VALUES (${user_id}, ${date}, ${seqno}, ${csv})
RETURNING id