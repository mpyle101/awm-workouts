INSERT INTO awm.block (user_id, workout_id, block_type, seqno, notes)
VALUES (${user_id}, ${workout_id}, ${block_type}, ${seqno}, ${notes})
RETURNING id