import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";

export const metadata = {
  title: "Vector Search",
  description: "Semantic search using PostgreSQL pgvector and AI embeddings.",
};


export default function VectorSearchPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Vector Search
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Semantic search that matches by meaning, not keywords. Powered by
        PostgreSQL pgvector and AI-generated embeddings.
      </p>

      <Callout type="warning">
        Vector search requires PostgreSQL with the{" "}
        <code>pgvector</code> extension. MySQL is not supported.
      </Callout>

      {/* ──────────────── OVERVIEW ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Overview
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <strong>Full-text search</strong> matches by keywords - the words in
        the query must appear in the data. <strong>Vector search</strong> matches
        by meaning - a search for &quot;best wineries&quot; can surface an article
        titled &quot;Top Vineyards to Visit&quot; even though the words don&apos;t
        overlap.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Feature</TableCell>
            <TableCell header>Full-Text</TableCell>
            <TableCell header>Vector</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ["Matches by", "Keywords", "Meaning"],
            ["Speed", "Fast", "Slower (embedding + similarity)"],
            ["Accuracy", "Exact terms", "Semantic similarity"],
            ["Best for", "IDs, codes, exact names", "Descriptions, articles, recommendations"],
          ].map(([feature, fullText, vector]) => (
            <TableRow key={feature}>
              <TableCell className="font-mono text-accent">{feature}</TableCell>
              <TableCell>{fullText}</TableCell>
              <TableCell>{vector}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        How It Works
      </Heading>
      <CodeBlock
        code={`// 1. Store: convert text to vector embedding, save alongside data
const embedding = await Embeddings::for([article.title]).generate();
await prisma.article.update({
  where: { id: article.id },
  data: { embedding: embedding[0].embedding }  // [0.012, -0.044, ...]
});

// 2. Query: convert search query to embedding, find closest vectors
const queryEmbedding = await Embeddings::for(["best wineries"]).generate();
const results = await prisma.$queryRaw\`
  SELECT *, 1 - (embedding <=> \${queryVector}::vector) AS similarity
  FROM articles
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> \${queryVector}::vector
  LIMIT 10
\`;`}
      />

      {/* ──────────────── SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Setup
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        1. Enable pgvector Extension
      </Heading>
      <CodeBlock
        code={`-- Run once as superuser
CREATE EXTENSION IF NOT EXISTS vector;`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        2. Add Vector Column
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Add a <code>vector</code> column to your table. The{" "}
        <code>dimensions</code> must match your embedding model&apos;s output (e.g.,
        1536 for OpenAI <code>text-embedding-3-small</code>).
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        3. Create HNSW Index
      </Heading>
      <CodeBlock
        code={`-- HNSW index for fast similarity search
CREATE INDEX ON articles USING hnsw (embedding vector_cosine_ops);`}
      />

      <Callout type="info">
        HNSW (Hierarchical Navigable Small World) is the recommended index
        for read-heavy semantic search. It offers strong recall without a
        training phase.
      </Callout>

      {/* ──────────────── PRISMA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Prisma
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query
      </Heading>
      <CodeBlock
        code={`import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function vectorSearch(queryEmbedding: number[], limit = 10, minSimilarity = 0.3) {
  const vector = \`[\${queryEmbedding.join(",")}]\`;

  return prisma.\$queryRaw\`
    SELECT *,
      1 - (embedding <=> \${vector}::vector) AS similarity
    FROM articles
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> \${vector}::vector) >= \${minSimilarity}
    ORDER BY embedding <=> \${vector}::vector
    LIMIT \${limit}
  \`;
}

// Usage
const results = await vectorSearch(queryEmbedding, 10, 0.3);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Helper Function
      </Heading>
      <CodeBlock
        code={`// Reusable vector search helper for Prisma
async function vectorSearch<T>(
  prisma: PrismaClient,
  table: string,
  embedding: number[],
  opts: { minSimilarity?: number; limit?: number; where?: string } = {}
): Promise<(T & { similarity: number })[]> {
  const vector = \`[\${embedding.join(",")}]\`;
  const minSimilarity = opts.minSimilarity ?? 0.3;
  const limit = opts.limit ?? 10;
  const whereClause = opts.where ? \`AND \${opts.where}\` : "";

  return prisma.\$queryRawUnsafe(\`
    SELECT *,
      1 - (embedding <=> '\${vector}'::vector) AS similarity
    FROM \${table}
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> '\${vector}'::vector) >= \${minSimilarity}
    \${whereClause}
    ORDER BY embedding <=> '\${vector}'::vector
    LIMIT \${limit}
  \`);
}

// Usage
const results = await vectorSearch(prisma, "articles", queryEmbedding, {
  minSimilarity: 0.3,
  limit: 10,
  where: "published = true"
});`}
      />

      {/* ──────────────── DRIZZLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Drizzle
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query
      </Heading>
      <CodeBlock
        code={`import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.DATABASE_URL!);

async function vectorSearch(queryEmbedding: number[], limit = 10, minSimilarity = 0.3) {
  const vector = \`[\${queryEmbedding.join(",")}]\`;

  return db.execute(sql\`
    SELECT *,
      1 - (embedding <=> \${vector}::vector) AS similarity
    FROM articles
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> \${vector}::vector) >= \${minSimilarity}
    ORDER BY embedding <=> \${vector}::vector
    LIMIT \${limit}
  \`);
}

// Usage
const results = await vectorSearch(queryEmbedding, 10, 0.3);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Helper Function
      </Heading>
      <CodeBlock
        code={`import { sql } from "drizzle-orm";
import type { NodePGDatabase } from "drizzle-orm/node-postgres";

async function vectorSearch<T>(
  db: NodePGDatabase<any>,
  table: string,
  embedding: number[],
  opts: { minSimilarity?: number; limit?: number; where?: string } = {}
) {
  const vector = \`[\${embedding.join(",")}]\`;
  const minSimilarity = opts.minSimilarity ?? 0.3;
  const limit = opts.limit ?? 10;
  const whereClause = opts.where ? sql\` AND \${sql.raw(opts.where)}\` : sql\`\`;

  return db.execute(sql\`
    SELECT *,
      1 - (embedding <=> \${vector}::vector) AS similarity
    FROM \${sql.raw(table)}
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> \${vector}::vector) >= \${minSimilarity}
    \${whereClause}
    ORDER BY embedding <=> \${vector}::vector
    LIMIT \${limit}
  \`);
}`}
      />

      {/* ──────────────── TYPEORM ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        TypeORM
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query
      </Heading>
      <CodeBlock
        code={`import { DataSource } from "typeorm";

const dataSource = new DataSource({ /* ... */ });

async function vectorSearch(queryEmbedding: number[], limit = 10, minSimilarity = 0.3) {
  const vector = \`[\${queryEmbedding.join(",")}]\`;

  return dataSource.query(\`
    SELECT *,
      1 - (embedding <=> \$1::vector) AS similarity
    FROM articles
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> \$1::vector) >= \$2
    ORDER BY embedding <=> \$1::vector
    LIMIT \$3
  \`, [vector, minSimilarity, limit]);
}

// Usage
const results = await vectorSearch(queryEmbedding, 10, 0.3);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Helper Function
      </Heading>
      <CodeBlock
        code={`import type { DataSource } from "typeorm";

async function vectorSearch<T>(
  dataSource: DataSource,
  table: string,
  embedding: number[],
  opts: { minSimilarity?: number; limit?: number; where?: string } = {}
): Promise<(T & { similarity: number })[]> {
  const vector = \`[\${embedding.join(",")}]\`;
  const minSimilarity = opts.minSimilarity ?? 0.3;
  const limit = opts.limit ?? 10;
  const whereClause = opts.where ? \`AND \${opts.where}\` : "";

  return dataSource.query(\`
    SELECT *,
      1 - (embedding <=> \$1::vector) AS similarity
    FROM \${table}
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> \$1::vector) >= \$2
    \${whereClause}
    ORDER BY embedding <=> \$1::vector
    LIMIT \$3
  \`, [vector, minSimilarity, limit]);
}`}
      />

      {/* ──────────────── HYBRID SEARCH ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Hybrid Search
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Combine full-text search (keyword precision) with vector search
        (semantic meaning) for best results.
      </p>
      <CodeBlock
        code={`// Prisma example: hybrid search
async function hybridSearch(query: string, queryEmbedding: number[]) {
  const vector = \`[\${queryEmbedding.join(",")}]\`;

  // Full-text search for exact keywords
  const keywordResults = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { body: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
  });

  // Vector search for semantic matches
  const semanticResults = await prisma.\$queryRaw\`
    SELECT *, 1 - (embedding <=> \${vector}::vector) AS similarity
    FROM articles
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> \${vector}::vector
    LIMIT 20
  \`;

  // Merge and deduplicate
  const seen = new Set();
  return [...semanticResults, ...keywordResults].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}`}
      />

      {/* ──────────────── RECOMMENDATIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Recommendations
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Find similar items by using an existing record&apos;s embedding as the
        anchor:
      </p>
      <CodeBlock
        code={`// Find articles similar to article #42
const article = await prisma.article.findUnique({ where: { id: 42 } });

const recommendations = await prisma.\$queryRaw\`
  SELECT *,
    1 - (embedding <=> \${article.embedding}::vector) AS similarity
  FROM articles
  WHERE id != 42
    AND embedding IS NOT NULL
  ORDER BY embedding <=> \${article.embedding}::vector
  LIMIT 5
\`;`}
      />

      {/* ──────────────── COST ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cost Considerations
      </Heading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Operation</TableCell>
            <TableCell header>Cost</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ["pgvector extension", "Free (open source)"],
            ["Embedding generation", "API call to AI provider (~$0.0001 per text)"],
            ["Vector storage", "Same as regular column storage"],
            ["Similarity query", "Free (computed by PostgreSQL)"],
          ].map(([op, cost]) => (
            <TableRow key={op}>
              <TableCell className="font-mono text-accent">{op}</TableCell>
              <TableCell>{cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Callout type="info">
        Generate embeddings asynchronously using a queue job. Do not block
        HTTP requests on embedding API calls.
      </Callout>
    </div>
  );
}
