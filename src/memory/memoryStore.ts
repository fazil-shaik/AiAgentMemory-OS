import { Pinecone } from "@pinecone-database/pinecone";
import { MemoryItem } from "../states/state.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";


const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX!);

const embedder = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY!,
});


async function embed(text: string): Promise<number[]> {
  const result = await embedder.embedQuery(text);
  return result;
}


export async function upsertMemory(
  memory: MemoryItem
): Promise<void> {
  const vector = await embed(memory.content);

  await index.upsert([
    {
      id: memory.id,
      values: vector,
      metadata: {
        content: memory.content,
        importance: memory.importance,
        timestamp: memory.timestamp,
        source: memory.source ?? "user",
      },
    },
  ]);
}

export async function retrieveMemory(
  query: string,
  topK = 5
): Promise<MemoryItem[]> {
  const queryVector = await embed(query);

  const result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return (
    result.matches?.map((match) => ({
      id: match.id,
      content: String(match.metadata?.content),
      importance: Number(match.metadata?.importance),
      timestamp: Number(match.metadata?.timestamp),
      source: (match.metadata?.source as MemoryItem["source"]) ?? "user",
    })) ?? []
  );
}

export async function deleteMemories(
  ids: string[]
): Promise<void> {
  await index.deleteMany(ids);
}


export async function overwriteMemories(
  memories: MemoryItem[]
): Promise<void> {
  const ids = memories.map((m) => m.id);
  if (ids.length > 0) {
    await deleteMemories(ids);
  }

  for (const memory of memories) {
    await upsertMemory(memory);
  }
}
