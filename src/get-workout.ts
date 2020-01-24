import { connect, load_sql } from './dbutils'

const main = async () => {
  const db = connect('postgres://jester@localhost/awm')
  const sql_select_workout = load_sql('select_workout.sql')
  let rows = await db.any(sql_select_workout, { date: '2017-09-23' })
  console.log(rows)

  rows = await db.any(sql_select_workout, { date: '2017-11-05' })
  console.log(rows)

  rows = await db.any(sql_select_workout, { date: '2020-01-023' })
  console.log(rows)
}

main()
