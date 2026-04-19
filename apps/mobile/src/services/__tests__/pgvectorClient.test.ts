import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PgVectorClient } from '../pgvectorClient'

describe('PgVectorClient', () => {
  let client: PgVectorClient
  let mockQuery: any

  beforeEach(() => {
    // Mock the query function
    mockQuery = vi.fn().mockResolvedValue({ rows: [] })

    // Create a test instance
    client = new PgVectorClient({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
    })

    // Override the internal client with mocks
    ;(client as any).client = {
      connect: vi.fn().mockResolvedValue(undefined),
      end: vi.fn().mockResolvedValue(undefined),
      query: mockQuery,
    }
  })

  describe('constructor', () => {
    it('should create a PgVectorClient with custom config', () => {
      const testClient = new PgVectorClient({
        host: 'db.example.com',
        port: 5433,
        database: 'custom_db',
        user: 'admin',
        password: 'secret',
      })

      expect(testClient).toBeDefined()
    })

    it('should use environment variables if no config provided', () => {
      const testClient = new PgVectorClient()
      expect(testClient).toBeDefined()
    })
  })

  describe('connect', () => {
    it('should connect to the database', async () => {
      await client.connect()
      expect((client as any).client.connect).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      ;(client as any).client.connect = vi.fn().mockRejectedValueOnce(new Error('Connection failed'))

      await expect(client.connect()).rejects.toThrow('Connection failed')
    })
  })

  describe('disconnect', () => {
    it('should disconnect from the database', async () => {
      await client.disconnect()
      expect((client as any).client.end).toHaveBeenCalled()
    })

    it('should handle disconnection errors', async () => {
      ;(client as any).client.end = vi.fn().mockRejectedValueOnce(new Error('Disconnect failed'))

      await expect(client.disconnect()).rejects.toThrow('Disconnect failed')
    })
  })

  describe('saveEmbedding', () => {
    it('should save a user embedding', async () => {
      const userId = 'user-1'
      const embedding = new Array(768).fill(0.5)

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.saveEmbedding(userId, embedding)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_embeddings'),
        [userId, expect.any(String)]
      )
    })

    it('should update existing embedding', async () => {
      const userId = 'user-1'
      const embedding = new Array(768).fill(0.3)

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.saveEmbedding(userId, embedding)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        [userId, expect.any(String)]
      )
    })

    it('should format embedding as string array', async () => {
      const userId = 'user-1'
      const embedding = [0.1, 0.2, 0.3]

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.saveEmbedding(userId, embedding)

      const args = mockQuery.mock.calls[0]
      expect(args[1][1]).toContain('[')
      expect(args[1][1]).toContain(']')
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await expect(client.saveEmbedding('user-1', [])).rejects.toThrow('Database error')
    })
  })

  describe('getEmbedding', () => {
    it('should retrieve a user embedding', async () => {
      const userId = 'user-1'
      const embedding = [0.1, 0.2, 0.3]

      mockQuery.mockResolvedValueOnce({
        rows: [{ embedding: JSON.stringify(embedding) }],
      })

      const result = await client.getEmbedding(userId)

      expect(result).toEqual(embedding)
    })

    it('should return null if embedding not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await client.getEmbedding('nonexistent-user')

      expect(result).toBeNull()
    })

    it('should parse embedding JSON correctly', async () => {
      const userId = 'user-1'
      const embedding = new Array(768).fill(0.5)

      mockQuery.mockResolvedValueOnce({
        rows: [{ embedding: JSON.stringify(embedding) }],
      })

      const result = await client.getEmbedding(userId)

      expect(result).toHaveLength(768)
      expect(result?.[0]).toBe(0.5)
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query failed'))

      await expect(client.getEmbedding('user-1')).rejects.toThrow('Query failed')
    })
  })

  describe('findSimilarUsers', () => {
    it('should find similar users by embedding vector', async () => {
      const embedding = new Array(768).fill(0.5)
      const limit = 10

      mockQuery.mockResolvedValueOnce({
        rows: [
          { user_id: 'user-2' },
          { user_id: 'user-3' },
          { user_id: 'user-4' },
        ],
      })

      const result = await client.findSimilarUsers(embedding, limit)

      expect(result).toHaveLength(3)
      expect(result).toContain('user-2')
    })

    it('should use default limit of 10', async () => {
      const embedding = [0.1, 0.2]

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.findSimilarUsers(embedding)

      const args = mockQuery.mock.calls[0]
      expect(args[1]).toContain(10)
    })

    it('should use custom limit', async () => {
      const embedding = [0.1, 0.2]

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.findSimilarUsers(embedding, 20)

      const args = mockQuery.mock.calls[0]
      expect(args[1]).toContain(20)
    })

    it('should use pgvector <=> operator for distance', async () => {
      const embedding = [0.1, 0.2]

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await client.findSimilarUsers(embedding, 5)

      const query = mockQuery.mock.calls[0][0]
      expect(query).toContain('<=>') // pgvector cosine distance operator
    })

    it('should return empty array if no similar users found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await client.findSimilarUsers([0.1, 0.2], 10)

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query failed'))

      await expect(client.findSimilarUsers([0.1, 0.2])).rejects.toThrow('Query failed')
    })
  })
})
