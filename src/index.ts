import "dotenv/config";
import "cheerio";
import { existsSync } from "fs";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

// Configuration constants
const VECTOR_STORE_DIR = "./data";
const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Libya";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Initialize embeddings model
const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004", // 768 dimensions
});

/**
 * Loads and splits text data from Wikipedia
 * @returns Split documents ready for embedding
 */
async function loadData() {
  const loader = new CheerioWebBaseLoader(WIKIPEDIA_URL, {
    selector: "p",
  });

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const docs = await loader.load();
  const splits = await textSplitter.splitDocuments(docs);
  return splits;
}

/**
 * Initializes a new vector store with document embeddings
 * @param dir Directory to save the vector store
 * @returns Initialized vector store
 */
async function initStore(dir: string): Promise<HNSWLib> {
  const splits = await loadData();
  const vectorStore = await HNSWLib.fromDocuments(splits, embeddings);
  await vectorStore.save(dir);
  return vectorStore;
}

/**
 * Loads an existing vector store from disk
 * @param dir Directory containing the vector store
 * @returns Loaded vector store
 */
async function loadStore(dir: string): Promise<HNSWLib> {
  return await HNSWLib.load(dir, embeddings);
}

/**
 * Gets or creates a vector store
 * @returns Vector store instance
 */
async function getVectorStore(): Promise<HNSWLib> {
  if (existsSync(VECTOR_STORE_DIR)) {
    console.log("Loading vector store from disk...");
    try {
      return await loadStore(VECTOR_STORE_DIR);
    } catch (error) {
      console.error("Error loading vector store:", error);
      console.warn("Creating a new vector store...");
      return await initStore(VECTOR_STORE_DIR);
    }
  }

  console.log("Creating a new vector store...");
  return await initStore(VECTOR_STORE_DIR);
}

// Initialize the RAG pipeline
const initRAG = async () => {
  const vectorStore = await getVectorStore();
  console.log("LOADED");
  const retriever = vectorStore.asRetriever();
  const prompt = ChatPromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.

    Question: {question}

    Context: {context}

    Answer:
    `);

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0,
  });

  return {
    retriever,
    chain: await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
    }),
  };
};

// Execute the RAG pipeline
const main = async () => {
  const { retriever, chain } = await initRAG();
  const question = "Where does libya rank in the world giving index";

  const retrievedDocs = await retriever.invoke(question);
  const response = await chain.invoke({
    question,
    context: retrievedDocs,
  });

  console.log("Retrieved Documents:", retrievedDocs);
  console.log("Response:", response);
};

await main();
