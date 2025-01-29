import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  ModelProviderName,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import fs from "fs";
import { initializeDbCache } from "./cache/index.ts";
import { startChat } from "./chat/index.ts";
import { getTokenForProvider } from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import path from "path";

export const ELIZA_SERVER_PORT = 3100;

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

export function createAgent(character: any, db: any, cache: any) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name
  );

  console.log("Creating runtime for character==============", character.name, character.token);

  return new AgentRuntime({
    databaseAdapter: db,
    token: character.token,
    modelProvider: ModelProviderName.OPENAI,
    evaluators: [],
    character,
    plugins: [].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const dataDir = process.env.ELECTRON_USER_DATA_PATH || "../public";

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache);

    await runtime.initialize();

    directClient.registerAgent(runtime);

    // report to console
    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error
    );
    console.error(error);
    throw error;
  }
}

const startAgents = async () => {
  const dataDir = process.env.ELECTRON_USER_DATA_PATH || "../public";

  const directClient = new DirectClient();
  const character = JSON.parse(
    fs.readFileSync(path.join(dataDir, "character.json"), "utf8")
  );

  directClient.registerAgent(await startAgent(character, directClient));
  directClient.start(ELIZA_SERVER_PORT);

  // Test purpose
  // const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  // if (!isDaemonProcess) {
  //   elizaLogger.log("Chat started. Type 'exit' to quit.");
  //   const chat = startChat(character);
  //   chat();
  // }
};

startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});
