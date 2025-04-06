import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

import ws from "ws";
import { env } from "../env.mjs";
neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

const sql = neon(env.DATABASE_URL);

export const db = drizzle({ client: sql });
