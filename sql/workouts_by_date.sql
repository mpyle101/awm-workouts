SELECT
  workout.created,
  workout.workout_date AS date,
  workout.seqno AS wrk_no,
  block.seqno AS blk_no,
  set_group.seqno AS grp_no,
  workout_set.setno AS set_no,
  workout_set.set_type AS set_type,
  workout_set.exercise AS set_exercise,
  workout_set.weight AS set_weight,
  workout_set.weight_unit AS set_unit,
  workout_set.reps AS set_reps,
  workout_set.duration AS set_duration,
  workout_set.distance AS set_distance,
  set_group.style AS grp_style,
  block.block_type AS blk_type,
  CASE block.block_type
    WHEN 'HIC' THEN concat(hic_block.style, fbt_block.style)
    WHEN 'FBT' THEN concat(fbt_block.style, hic_block.style)
  END AS blk_style,
  CASE block.block_type
    WHEN 'SE' THEN se_block.duration
    WHEN 'HIC' THEN hic_block.duration
    WHEN 'FBT' THEN fbt_block.duration
  END AS blk_duration,
  CASE block.block_type
    WHEN 'FBT' THEN fbt_block.exercise
  END AS blk_exercise,
  CASE block.block_type
    WHEN 'HIC' THEN hic_block.distance
  END AS blk_distance
FROM
  workout
INNER JOIN
  block ON workout.id = block.workout_id
INNER JOIN
  set_group ON block.id = set_group.block_id
INNER JOIN
  workout_set ON set_group.id = workout_set.group_id
LEFT JOIN
  se_block ON block.id = se_block.id AND block.block_type = 'SE'
LEFT JOIN
  hic_block ON block.id = hic_block.id AND block.block_type = 'HIC'
LEFT JOIN
  fbt_block ON block.id = fbt_block.id AND block.block_type = 'FBT'
WHERE
  workout.workout_date = ${date}