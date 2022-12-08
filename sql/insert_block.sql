INSERT INTO block (user_id, workout_id, block_type, seqno, duration, notes)
VALUES (:user_id, :workout_id, :block_type, :seqno, :duration, :notes)
RETURNING id