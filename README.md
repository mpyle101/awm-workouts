# awm-workouts
Workout database loader from a Numbers spreadsheet

Using to get Numbers to dump the workout data to a CSV file.
Python to turn the CSV into JSON.
mongo and mongoimport to load the JSON into a MongoDB.
TypeScript node application to convert the JSON into records for loading into postgres.
Driven by a shell script so I can move my workout data from the spreadsheet automagically.
