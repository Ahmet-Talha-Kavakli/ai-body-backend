import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

const adapter = new SQLiteAdapter({ schema, dbName: 'fitai' });
export const db = new Database({ adapter });
