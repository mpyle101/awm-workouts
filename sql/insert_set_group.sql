INSERT INTO awm.set_group (user_id, block_id, style, seqno)
VALUES (${user_id}, ${block_id}, ${style}, ${seqno})
RETURNING id