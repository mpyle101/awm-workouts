import { connect, load_sql } from './db-utils'

const main = async () => {
  const db = connect('postgres://jester@localhost/awm')
  const sql_workouts_by_date = load_sql('workouts_by_date.sql')
  let rows = await db.any(sql_workouts_by_date, { date: '2017-09-23' })
  console.log(rows)

  rows = await db.any(sql_workouts_by_date, { date: '2017-11-05' })
  console.log(rows)

  rows = await db.any(sql_workouts_by_date, { date: '2020-01-23' })
  console.log(rows)

  rows = await db.any(sql_workouts_by_date, { date: '2017-06-01'})
  console.log(rows)
}

main()
