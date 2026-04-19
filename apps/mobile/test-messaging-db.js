const { openDatabaseSync } = require('expo-sqlite');

const db = openDatabaseSync('messaging.db');

async function test() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS test_messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL
      );
    `);
    console.log('✓ Table created');

    await db.runAsync(
      'INSERT INTO test_messages (id, content) VALUES (?, ?)',
      ['msg-1', 'Hello']
    );
    console.log('✓ Message inserted');

    const results = await db.getAllAsync('SELECT * FROM test_messages');
    console.log('✓ Query results:', results);
  } catch (err) {
    console.error('✗ Error:', err);
  }
}

test();
