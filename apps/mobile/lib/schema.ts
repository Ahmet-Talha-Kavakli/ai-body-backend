import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'offline_sessions',
      columns: [
        { name: 'exercise_name', type: 'string' },
        { name: 'reps', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'form_score', type: 'number' },
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
