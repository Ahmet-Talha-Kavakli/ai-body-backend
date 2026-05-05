-- Idempotent SQL index'leri — Prisma `db push` Unsupported field'larda
-- index yönetmediği için bu dosya manuel olarak çağrılır.
--
-- Çağırma: pnpm prisma db execute --file prisma/sql/idempotent-indexes.sql --schema prisma/schema.prisma
-- Veya: package.json'da `db:push` komutu sonrasında otomatik.

-- ============================================================================
-- pgvector HNSW indexleri
-- ============================================================================
-- HNSW = Hierarchical Navigable Small World
-- Cosine similarity için en hızlı (V4 plan'da Faz B çıkış kriteri)
-- m=16, ef_construction=64 = pgvector defaults (1M+ vector için iyi)
-- Yapılış süresi: tablo başına 5-30sn (mevcut row sayısına göre)

-- AssistantMessage embedding (V3 RAG için kritik)
CREATE INDEX IF NOT EXISTS "AssistantMessage_embedding_hnsw_idx"
  ON "AssistantMessage"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- MemoryNode embedding (V4 graph context loader için kritik)
CREATE INDEX IF NOT EXISTS "MemoryNode_embedding_hnsw_idx"
  ON "MemoryNode"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- AssistantConversation composite index (V4 perf)
-- ============================================================================
-- Karakterler endpoint'inde "userId + characterId + son güncellenen" sorgusu sık.
-- Sıralama gerektirdiği için composite index hızlandırır.
CREATE INDEX IF NOT EXISTS "AssistantConversation_user_char_updated_idx"
  ON "AssistantConversation" ("userId", "characterId", "updatedAt" DESC);
