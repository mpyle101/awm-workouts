INSERT INTO awm.set_group (block_id, style, interval, seqno)
VALUES (${block_id}, ${style}, ${interval}, ${seqno})
RETURNING id