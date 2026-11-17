# SQLite exploration

I ran these queries in DB Browser for SQLite:

```sql
SELECT * FROM tasks;
SELECT * FROM tasks WHERE done = 1;
SELECT COUNT(*) AS task_count FROM tasks;
UPDATE tasks SET done = 1;
DELETE FROM tasks WHERE done = 1;
```

The count query returned 3.

After updating every task and clicking Write Changes, GET /tasks showed
every task as completed without restarting the API.

After deleting completed tasks and saving, GET /tasks returned an empty array.

Restarting the API restored the three sample tasks because the startup
code seeds the table whenever it is empty.