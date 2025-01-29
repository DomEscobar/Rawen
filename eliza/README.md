# Eliza

## Edit the character files

Open `src/character.ts` to modify the default character. Uncomment and edit.

### Custom characters

To load custom characters instead:
- Use `pnpm start --characters="path/to/your/character.json"`
- Multiple character files can be loaded simultaneously

### Add clients
```
# in character.ts
clients: [Clients.TWITTER, Clients.DISCORD],

# in character.json
clients: ["twitter", "discord"]
```

## Duplicate the .env.example template

```bash
cp .env.example .env
```

\* Fill out the .env file with your own values.

### Add login credentials and keys to .env
```
DISCORD_APPLICATION_ID="discord-application-id"
DISCORD_API_TOKEN="discord-api-token"
...
OPENROUTER_API_KEY="sk-xx-xx-xxx"
...
TWITTER_USERNAME="username"
TWITTER_PASSWORD="password"
TWITTER_EMAIL="your@email.com"
```

## Install dependencies and start your agent

```bash
pnpm i && pnpm start
```
Note: this requires node to be at least version 22 when you install packages and run the agent.

## Run with Docker

### Build and run Docker Compose (For x86_64 architecture)

#### Edit the docker-compose.yaml file with your environment variables

```yaml
services:
    eliza:
        environment:
            - OPENROUTER_API_KEY=blahdeeblahblahblah
```

#### Run the image

```bash
docker compose up
```

### Build the image with Mac M-Series or aarch64

Make sure docker is running.

```bash
# The --load flag ensures the built image is available locally
docker buildx build --platform linux/amd64 -t eliza-starter:v1 --load .
```

#### Edit the docker-compose-image.yaml file with your environment variables

```yaml
services:
    eliza:
        environment:
            - OPENROUTER_API_KEY=blahdeeblahblahblah
```

#### Run the image

```bash
docker compose -f docker-compose-image.yaml up
```


🤖 Agents
Agents are the core components of the Eliza framework that handle autonomous interactions. Each agent runs in a runtime environment and can interact through various clients (Discord, Telegram, etc.) while maintaining consistent behavior and memory.

Overview
The AgentRuntime class is the primary implementation of the IAgentRuntime interface, which manages the agent's core functions, including:

Message and Memory Processing: Storing, retrieving, and managing conversation data and contextual memory.
State Management: Composing and updating the agent’s state for a coherent, ongoing interaction.
Action Execution: Handling behaviors such as transcribing media, generating images, and following rooms.
Evaluation and Response: Assessing responses, managing goals, and extracting relevant information.
Core Components
Each agent runtime consists of key components that enable flexible and extensible functionality:

Clients: Enable communication across platforms such as Discord, Telegram, and Direct (REST API), with features tailored for each platform.
Providers: Extend the agent’s capabilities by integrating with additional services (e.g., time, wallet, or custom data).
Actions: Define agent behaviors, such as following rooms, generating images, or processing attachments. Custom actions can be created to tailor behaviors to specific needs.
Evaluators: Manage agent responses by assessing message relevance, managing goals, extracting facts, and building long-term memory.
AgentRuntime Interface
The IAgentRuntime interface defines the main structure of the runtime environment, specifying the configuration and essential components:

interface IAgentRuntime {
    // Core identification
    agentId: UUID;
    serverUrl: string;
    token: string;

    // Configuration
    character: Character;
    modelProvider: ModelProviderName;

    // Components
    actions: Action[];
    evaluators: Evaluator[];
    providers: Provider[];

    // Database & Memory
    databaseAdapter: IDatabaseAdapter;
    messageManager: IMemoryManager;
    descriptionManager: IMemoryManager;
    loreManager: IMemoryManager;
}

Each element in the runtime interface plays a crucial role:

Identification: Agent ID, server URL, and token for authentication and identification.
Configuration: Character profile and model provider define the agent's personality and language model.
Components: Actions, evaluators, and providers support extensible behaviors, response evaluation, and service integration.
Memory Management: Specialized memory managers track conversations, descriptions, and static knowledge to enable contextual and adaptive responses.
Creating an Agent Runtime
This section demonstrates setting up an agent with basic and optional configurations. It provides a working example and sample code that helps users quickly start building:

import { AgentRuntime, ModelProviderName } from "@elizaos/core";

// Configuration example
const runtime = new AgentRuntime({
    token: "auth-token",
    modelProvider: ModelProviderName.ANTHROPIC,
    character: characterConfig,
    databaseAdapter: new DatabaseAdapter(),
    conversationLength: 32,
    serverUrl: "http://localhost:7998",
    actions: customActions,
    evaluators: customEvaluators,
    providers: customProviders,
});

State Management
This section covers how agents manage and update state, with a focus on initial state composition and updating methods. The runtime maintains state through the State interface:

interface State {
    userId?: UUID;
    agentId?: UUID;
    roomId: UUID;
    bio: string;
    lore: string;
    agentName?: string;
    senderName?: string;
    actors: string;
    actorsData?: Actor[];
    recentMessages: string;
    recentMessagesData: Memory[];
    goals?: string;
    goalsData?: Goal[];
    actions?: string;
    actionNames?: string;
    providers?: string;
}

State composition and updates are handled through dedicated methods:

// Compose initial state
const state = await runtime.composeState(message, {
    additionalContext: "custom-context",
});

// Update message state
const updatedState = await runtime.updateRecentMessageState(state);

Best practices

Keep state immutable where possible
Use composeState for initial state creation
Use updateRecentMessageState for updates
Cache frequently accessed state data
Memory Systems
The Eliza framework uses multiple types of memory to support an agent's long-term engagement, contextual understanding, and adaptive responses. Each type of memory serves a specific purpose:

Message History: Stores recent conversations to provide continuity within a session. This helps the agent maintain conversational context and avoid repetitive responses within short-term exchanges.

Factual Memory: Holds specific, context-based facts about the user or environment, such as user preferences, recent activities, or specific details mentioned in previous interactions. This type of memory enables the agent to recall user-specific information across sessions.

Knowledge Base: Contains general knowledge the agent might need to respond to broader queries or provide informative answers. This memory is more static, helping the agent retrieve pre-defined data, common responses, or static character lore.

Relationship Tracking: Manages the agent’s understanding of its relationship with users, including details like user-agent interaction frequency, sentiment, and connection history. It is particularly useful for building rapport and providing a more personalized interaction experience over time.

RAG Integration: Uses a vector search to perform contextual recall based on similarity matching. This enables the agent to retrieve relevant memory snippets or knowledge based on the content and intent of the current conversation, making its responses more contextually relevant.

The runtime uses multiple specialized IMemoryManager instances:

messageManager - conversation messages and responses
descriptionManager - user descriptions and profiles
loreManager - static character knowledge
Message Processing
The runtime's message processing is handled through the processActions method:

// Process message with actions
await runtime.processActions(message, responses, state, async (newMessages) => {
    // Handle new messages
    return [message];
});

Services and Memory Management
Services are managed through the getService and registerService methods:

// Register service
runtime.registerService(new TranscriptionService());

// Get service
const service = runtime.getService<ITranscriptionService>(
    ServiceType.TRANSCRIPTION,
);

Memory Management
Memory managers are accessed via getMemoryManager:

// Get memory manager
const memoryManager = runtime.getMemoryManager("messages");

// Create memory
await memoryManager.createMemory({
    id: messageId,
    content: { text: "Message content" },
    userId: userId,
    roomId: roomId,
});

Best practices

Use appropriate memory managers for different data types
Consider memory limits when storing data, regularly clean up memory
Use the unique flag for deduplicated storage
Clean up old memories periodically
Use immutability in state management.
Log errors and maintain stability during service failures.
Evaluation System
The runtime's evaluate method processes evaluations:

// Evaluate message
const evaluationResults = await runtime.evaluate(message, state, didRespond);

Usage Examples
Message Processing:
await runtime.processActions(message, responses, state, (newMessages) => {
    return [message];
});

State Management:
const state = await runtime.composeState(message, {
    additionalContext: "custom-context",
});

Memory Management:
const memoryManager = runtime.getMemoryManager("messages");
await memoryManager.createMemory({
    id: messageId,
    content: { text: "Message content" },
    userId,
    roomId,
});


🔌 Providers
Providers are core modules that inject dynamic context and real-time information into agent interactions. They serve as a bridge between the agent and various external systems, enabling access to market data, wallet information, sentiment analysis, and temporal context.

Overview
A provider's primary purpose is to:

Supply dynamic contextual information
Integrate with the agent runtime
Format information for conversation templates
Maintain consistent data access
Core Structure
interface Provider {
    get: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<string>;
}

Built-in Providers
Time Provider
Provides temporal context for agent interactions:

const timeProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory) => {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString("en-US");
        const currentYear = currentDate.getFullYear();
        return `The current time is: ${currentTime}, ${currentYear}`;
    },
};

Facts Provider
From bootstrap plugin - maintains conversation facts:

const factsProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // Create embedding for recent messages and retrieve relevant facts
        const recentMessages = formatMessages({
            messages: state?.recentMessagesData?.slice(-10),
            actors: state?.actorsData,
        });
        const embedding = await embed(runtime, recentMessages);
        const memoryManager = new MemoryManager({
            runtime,
            tableName: "facts",
        });
        const recentFactsData = await memoryManager.getMemories({
            roomId: message.roomId,
            count: 10,
            agentId: runtime.agentId,
        });

        // Combine and format facts
        const allFacts = [...recentFactsData]; // Deduplication can be skipped if no overlap
        const formattedFacts = formatFacts(allFacts);

        return `Key facts that ${runtime.character.name} knows:\n${formattedFacts}`;
    },
};

export { factsProvider };

Boredom Provider
From bootstrap plugin - manages conversation dynamics and engagement by calculating the boredom level of an agent based on recent messages in a chat room.

Data Structures:

boredomLevels: An array of objects, each representing a boredom level with a minimum score and a set of status messages that reflect the agent's current engagement.
interestWords, cringeWords, and negativeWords: Arrays of words that influence the boredom score based on their presence in messages.
Boredom Calculation:

The boredomProvider gets recent messages from the agent’s conversation over the last 15 minutes.
It calculates a boredom score by analyzing the text of these messages. The score is influenced by:
Interest words: Decrease boredom (subtract 1 point).
Cringe words: Increase boredom (add 1 point).
Negative words: Increase boredom (add 1 point).
Exclamation marks: Increase boredom (add 1 point).
Question marks: Increase or decrease boredom depending on the sender.
Boredom Level:
The boredom score is matched to a level from the boredomLevels array, which defines how engaged the agent feels.
A random status message from the selected boredom level is chosen and the agent’s name is inserted into the message.
interface BoredomLevel {
    minScore: number;
    statusMessages: string[];
}

The result is a message that reflects the agent's perceived level of engagement in the conversation, based on their recent interactions.

const boredomProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        const messages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 10,
        });

        return messages.length > 0
            ? "Actively engaged in conversation"
            : "No recent interactions";
    },
};

Features:

Engagement tracking
Conversation flow management
Natural disengagement
Sentiment analysis
Response adaptation
Implementation
Basic Provider Template
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

const customProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // Get relevant data using runtime services
        const memories = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 5,
        });

        // Format and return context
        return formatContextString(memories);
    },
};

Memory Integration
const memoryProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        // Get recent messages
        const messages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 5,
            unique: true,
        });

        // Get user descriptions
        const descriptions = await runtime.descriptionManager.getMemories({
            roomId: message.roomId,
            userId: message.userId,
        });

        // Combine and format
        return `
Recent Activity:
${formatMessages(messages)}

User Context:
${formatDescriptions(descriptions)}
    `.trim();
    },
};

Best Practices
1. Data Management
Implement robust caching strategies
Use appropriate TTL for different data types
Validate data before caching
2. Performance
// Example of optimized data fetching
async function fetchDataWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
): Promise<T> {
    const cached = await cache.get(key);
    if (cached) return cached;

    const data = await fetcher();
    await cache.set(key, data);
    return data;
}

3. Error Handling
Implement retry mechanisms
Provide fallback values
Log errors comprehensively
Handle API timeouts
4. Security
Validate input parameters
Sanitize returned data
Implement rate limiting
Handle sensitive data appropriately
Integration with Runtime
Providers are registered with the AgentRuntime:

// Register provider
runtime.registerContextProvider(customProvider);

// Providers are accessed through composeState
const state = await runtime.composeState(message);

Example: Complete Provider
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

const comprehensiveProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // Get recent messages
            const messages = await runtime.messageManager.getMemories({
                roomId: message.roomId,
                count: 5,
            });

            // Get user context
            const userContext = await runtime.descriptionManager.getMemories({
                roomId: message.roomId,
                userId: message.userId,
            });

            // Get relevant facts
            const facts = await runtime.messageManager.getMemories({
                roomId: message.roomId,
                tableName: "facts",
                count: 3,
            });

            // Format comprehensive context
            return `
# Conversation Context
${messages.map((m) => `- ${m.content.text}`).join("\n")}

# User Information
${userContext.map((c) => c.content.text).join("\n")}

# Related Facts
${facts.map((f) => `- ${f.content.text}`).join("\n")}
      `.trim();
        } catch (error) {
            console.error("Provider error:", error);
            return "Context temporarily unavailable";
        }
    },
};

Troubleshooting
Stale Data

// Implement cache invalidation
const invalidateCache = async (pattern: string) => {
    const keys = await cache.keys(pattern);
    await Promise.all(keys.map((k) => cache.del(k)));
};

Rate Limiting

// Implement backoff strategy
const backoff = async (attempt: number) => {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));
};

API Failures

// Implement fallback data sources
const getFallbackData = async () => {
    // Attempt alternative data sources
};

⚡ Actions
Actions are core building blocks in Eliza that define how agents respond to and interact with messages. They allow agents to interact with external systems, modify their behavior, and perform tasks beyond simple message responses.

Overview
Each Action consists of:

name: Unique identifier for the action
similes: Array of alternative names/variations
description: Detailed explanation of the action's purpose
validate: Function that checks if action is appropriate
handler: Implementation of the action's behavior
examples: Array of example usage patterns
Implementation
interface Action {
    name: string;
    similes: string[];
    description: string;
    examples: ActionExample[][];
    handler: Handler;
    validate: Validator;
    suppressInitialMessage?: boolean;
}

Source: https://github.com/elizaos/eliza/packages/core/src/types.ts

Built-in Actions
Conversation Flow
CONTINUE
Maintains conversation when more context is needed
Manages natural dialogue progression
Limited to 3 consecutive continues
IGNORE
Gracefully disengages from conversations
Handles:
Inappropriate interactions
Natural conversation endings
Post-closing responses
NONE
Default response action
Used for standard conversational replies
External Integrations
TAKE_ORDER
Records trading/purchase orders
Processes user conviction levels
Validates ticker symbols and contract addresses
const take_order: Action = {
    name: "TAKE_ORDER",
    similes: ["BUY_ORDER", "PLACE_ORDER"],
    description: "Records a buy order based on the user's conviction level.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = (message.content as Content).text;
        const tickerRegex = /\b[A-Z]{1,5}\b/g;
        return tickerRegex.test(text);
    },
    // ... rest of implementation
};

Source: https://github.com/elizaos/eliza/packages/plugin-solana/src/actions/takeOrder.ts

Creating Custom Actions
Implement the Action interface
Define validation logic
Implement handler functionality
Provide usage examples
Example:

const customAction: Action = {
    name: "CUSTOM_ACTION",
    similes: ["SIMILAR_ACTION"],
    description: "Action purpose",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validation logic
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // Implementation
    },
    examples: [],
};

Testing Actions
Use the built-in testing framework:

test("Validate action behavior", async () => {
    const message: Memory = {
        userId: user.id,
        content: { text: "Test message" },
        roomId,
    };

    const response = await handleMessage(runtime, message);
    // Verify response
});

Core Concepts
Action Structure
interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<void>;
    examples: ActionExample[][];
    suppressInitialMessage?: boolean;
}

Key Components
name: Unique identifier for the action
similes: Alternative names/triggers for the action
description: Explains when and how the action should be used
validate: Determines if the action can be executed
handler: Implements the action's behavior
examples: Demonstrates proper usage patterns
suppressInitialMessage: When true, suppress the initial response message before processing the action. Useful for actions that generate their own responses (like image generation)
Built-in Actions
CONTINUE
Continues the conversation when appropriate:

const continueAction: Action = {
    name: "CONTINUE",
    similes: ["ELABORATE", "KEEP_TALKING"],
    description:
        "Used when the message requires a follow-up. Don't use it when the conversation is finished.",
    validate: async (runtime, message) => {
        // Validation logic
        return true;
    },
    handler: async (runtime, message, state) => {
        // Continuation logic
    },
};

IGNORE
Stops responding to irrelevant or completed conversations:

const ignoreAction: Action = {
    name: "IGNORE",
    similes: ["STOP_TALKING", "STOP_CHATTING"],
    description:
        "Used when ignoring the user is appropriate (conversation ended, user is aggressive, etc.)",
    handler: async (runtime, message) => {
        return true;
    },
};

FOLLOW_ROOM
Actively participates in a conversation:

const followRoomAction: Action = {
    name: "FOLLOW_ROOM",
    similes: ["FOLLOW_CHAT", "FOLLOW_CONVERSATION"],
    description:
        "Start following channel with interest, responding without explicit mentions.",
    handler: async (runtime, message) => {
        // Room following logic
    },
};

Creating Custom Actions
Basic Action Template
const customAction: Action = {
    name: "CUSTOM_ACTION",
    similes: ["ALTERNATE_NAME", "OTHER_TRIGGER"],
    description: "Detailed description of when and how to use this action",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validation logic
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // Implementation logic
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Trigger message" },
            },
            {
                user: "{{user2}}",
                content: { text: "Response", action: "CUSTOM_ACTION" },
            },
        ],
    ],
};

Advanced Action Example
const complexAction: Action = {
    name: "PROCESS_DOCUMENT",
    similes: ["READ_DOCUMENT", "ANALYZE_DOCUMENT"],
    description: "Process and analyze uploaded documents",
    validate: async (runtime, message) => {
        const hasAttachment = message.content.attachments?.length > 0;
        const supportedTypes = ["pdf", "txt", "doc"];
        return (
            hasAttachment &&
            supportedTypes.includes(message.content.attachments[0].type)
        );
    },
    handler: async (runtime, message, state) => {
        const attachment = message.content.attachments[0];

        // Process document
        const content = await runtime
            .getService<IDocumentService>(ServiceType.DOCUMENT)
            .processDocument(attachment);

        // Store in memory
        await runtime.documentsManager.createMemory({
            id: generateId(),
            content: { text: content },
            userId: message.userId,
            roomId: message.roomId,
        });

        return true;
    },
};

Implementation Patterns
State-Based Actions
const stateAction: Action = {
    name: "UPDATE_STATE",
    handler: async (runtime, message, state) => {
        const newState = await runtime.composeState(message, {
            additionalData: "new-data",
        });

        await runtime.updateState(newState);
        return true;
    },
};

Service Integration
const serviceAction: Action = {
    name: "TRANSCRIBE_AUDIO",
    handler: async (runtime, message) => {
        const transcriptionService = runtime.getService<ITranscriptionService>(
            ServiceType.TRANSCRIPTION,
        );

        const result = await transcriptionService.transcribe(
            message.content.attachments[0],
        );

        return true;
    },
};

Best Practices
Action Design
Clear Purpose

Single responsibility principle
Well-defined triggers
Clear success criteria
Robust Validation

Check prerequisites
Validate input data
Handle edge cases
Error Handling

Graceful failure
Meaningful error messages
State recovery
Example Organization
Comprehensive Coverage
examples: [
    // Happy path
    [basicUsageExample],
    // Edge cases
    [edgeCaseExample],
    // Error cases
    [errorCaseExample],
];

Clear Context
examples: [
    [
        {
            user: "{{user1}}",
            content: {
                text: "Context message showing why action is needed",
            },
        },
        {
            user: "{{user2}}",
            content: {
                text: "Clear response demonstrating action usage",
                action: "ACTION_NAME",
            },
        },
    ],
];

Troubleshooting
Common Issues
Action Not Triggering

Check validation logic
Verify similes list
Review example patterns
Handler Failures

Validate service availability
Check state requirements
Review error logs
State Inconsistencies

Verify state updates
Check concurrent modifications
Review state transitions
Advanced Features
Action Composition
const compositeAction: Action = {
    name: "PROCESS_AND_RESPOND",
    handler: async (runtime, message) => {
        // Process first action
        await runtime.processAction("ANALYZE_CONTENT", message);

        // Process second action
        await runtime.processAction("GENERATE_RESPONSE", message);

        return true;
    },
};

Action Chains
const chainedAction: Action = {
    name: "WORKFLOW",
    handler: async (runtime, message) => {
        const actions = ["VALIDATE", "PROCESS", "RESPOND"];

        for (const actionName of actions) {
            await runtime.processAction(actionName, message);
        }

        return true;
    },
};

Example: Complete Action Implementation
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

const documentAnalysisAction: Action = {
    name: "ANALYZE_DOCUMENT",
    similes: ["READ_DOCUMENT", "PROCESS_DOCUMENT", "REVIEW_DOCUMENT"],
    description: "Analyzes uploaded documents and provides insights",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Check for document attachment
        if (!message.content.attachments?.length) {
            return false;
        }

        // Verify document type
        const attachment = message.content.attachments[0];
        return ["pdf", "txt", "doc"].includes(attachment.type);
    },

    handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // Get document service
            const docService = runtime.getService<IDocumentService>(
                ServiceType.DOCUMENT,
            );

            // Process document
            const content = await docService.processDocument(
                message.content.attachments[0],
            );

            // Store analysis
            await runtime.documentsManager.createMemory({
                id: generateId(),
                content: {
                    text: content,
                    analysis: await docService.analyze(content),
                },
                userId: message.userId,
                roomId: message.roomId,
                createdAt: Date.now(),
            });

            return true;
        } catch (error) {
            console.error("Document analysis failed:", error);
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you analyze this document?",
                    attachments: [{ type: "pdf", url: "document.pdf" }],
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll analyze that document for you",
                    action: "ANALYZE_DOCUMENT",
                },
            },
        ],
    ],
};

Best Practices
Validation

Thoroughly check input parameters
Verify runtime conditions
Handle edge cases
Error Handling

Implement comprehensive error catching
Provide clear error messages
Clean up resources properly
Documentation

Include clear usage examples
Document expected inputs/outputs
Explain error scenarios