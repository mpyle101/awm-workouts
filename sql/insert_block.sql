INSERT INTO awm.block (workout_id, block_type, seqno, notes)
VALUES (${workout_id}, ${block_type}, ${seqno}, ${notes})
RETURNING id