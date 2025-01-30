/**
 * Calls the Eliza chat server with the given prompt and handles streaming responses
 *
 * @param prompt The user's input prompt
 * @param callback Function to handle streaming response chunks
 * @param abortController Controller to abort the request
 * @param history Previous conversation history (optional)
 */
export async function callElizaChat(
  url: string,
  prompt: string,
  callback: Function,
  abortController: AbortController,
  history: any[] = []
) {
  try {
    const response = await fetch(
     url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          userId: "user", // Default user ID
          userName: "User", // Default user name
          history: history, // Pass conversation history
        }),
        signal: abortController.signal, // Allow aborting request
      }
    );

    if (!response.ok) {
      throw new Error(`Eliza server error: ${response.statusText}`);
    }

    // Parse streaming response
    const data = await response.json();

    // Process each message in the response
    data.forEach((message: any) => {
      if (callback && message.text) {
        callback(message.text);
      }
    });

    // Return the full response text
    return data.map((m: any) => m.text).join("\n");
  } catch (error) {
    if (error.name === "AbortError") {
      throw error; // Re-throw abort errors
    }
    console.error("Eliza chat error:", error);
    throw new Error("Failed to communicate with Eliza server");
  }
}
