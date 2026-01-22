export type MemoryItem = {
  id: string;

  content: string;

  importance: number;

  timestamp: number;

  source?: "user" | "system" | "compressed";
};

export type AgentState = {
  userInput: string;

  shortTermContext: string[];

  longTermMemory: MemoryItem[];

  retrievedMemory: MemoryItem[];

  response?: string;
};
