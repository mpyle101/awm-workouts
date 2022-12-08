INSERT INTO workout (user_id, workout_date, seqno, csv)
VALUES (:user_id, :workout_date, :seqno, :csv)
RETURNING id