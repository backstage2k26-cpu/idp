import { db } from './db';

async function test() {
  try {
    const [rows] = await db.query('SELECT NOW()');

    console.log(rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();