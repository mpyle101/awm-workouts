INSERT INTO awm.set_group (block_id, style, duration, seqno)
VALUES (${block_id}, ${style}, ${duration}, ${seqno})
RETURNING id