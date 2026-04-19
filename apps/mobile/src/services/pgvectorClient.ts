// PostgreSQL + pgvector wrapper for embedding storage and similarity search
// Note: pg client is for backend use - initialized only when available

let Client: any = null

// Try to import pg client (available on Node.js backend, not React Native)
try {
  const pg = require('pg')
  Client = pg.Client
} catch (e) {
  // pg not available - client will be mocked in React Native environment
  Client = null
}

export class PgVectorClient {
  private client: any

  constructor(config?: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }) {
    if (Client) {
      this.client = new Client(
        config || {
          host: process.env.EXPO_PUBLIC_PG_HOST || 'localhost',
          port: parseInt(process.env.EXPO_PUBLIC_PG_PORT || '5432'),
          database: process.env.EXPO_PUBLIC_PG_DB || 'fitai',
          user: process.env.EXPO_PUBLIC_PG_USER || 'postgres',
          password: process.env.EXPO_PUBLIC_PG_PASSWORD || 'postgres',
        }
      )
    } else {
      // Mock client for testing
      this.client = {
        connect: async () => {},
        end: async () => {},
        query: async () => ({ rows: [] }),
      }
    }
  }

  async connect(): Promise<void> {
    await this.client.connect()
  }

  async disconnect(): Promise<void> {
    await this.client.end()
  }

  async saveEmbedding(userId: string, embedding: number[]): Promise<void> {
    const embeddingStr = `[${embedding.join(',')}]`
    await this.client.query(
      'INSERT INTO user_embeddings (user_id, embedding, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET embedding = $2, updated_at = NOW()',
      [userId, embeddingStr]
    )
  }

  async getEmbedding(userId: string): Promise<number[] | null> {
    const result = await this.client.query('SELECT embedding FROM user_embeddings WHERE user_id = $1', [
      userId,
    ])
    if (result.rows.length === 0) return null
    return JSON.parse(result.rows[0].embedding)
  }

  async findSimilarUsers(embedding: number[], limit: number = 10): Promise<string[]> {
    const embeddingStr = `[${embedding.join(',')}]`
    const result = await this.client.query(
      `SELECT user_id FROM user_embeddings ORDER BY embedding <=> $1 LIMIT $2`,
      [embeddingStr, limit]
    )
    return result.rows.map((r: any) => r.user_id)
  }
}

export const pgvectorClient = new PgVectorClient()
