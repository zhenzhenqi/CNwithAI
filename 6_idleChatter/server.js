// Import required modules
const express = require('express');
const fs = require('fs').promises; // Use the promise-based version of fs
const path = require('path');
require('dotenv').config(); // Loads environment variables from .env file
const OpenAI = require('openai');

// Initialize the Express app
const app = express();
const port = 3000;

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Path to the JSON file where messages will be stored
const messagesFilePath = path.join(__dirname, 'conversation.json');

// --- Helper function to initialize the conversation ---
const initializeConversation = async () => {
  const initialMessage = [
    {
      "role": "assistant",
      "content": "Hi, I'm BoBo. Nice to meet you."
    }
  ];
  try {
    // Delete all data in the file by writing an empty array
    await fs.writeFile(messagesFilePath, '[]', 'utf8');
    console.log('conversation.json data has been cleared.');

    // Write the new initial message to the file
    await fs.writeFile(messagesFilePath, JSON.stringify(initialMessage, null, 2), 'utf8');
    console.log('conversation.json initialized with the welcome message.');
  } catch (error) {
    console.error('Failed to initialize conversation.json:', error);
  }
};

// --- Middleware ---

// 1. Serve static files (like your HTML and GIF) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 2. Enable the express app to parse JSON in the request body
app.use(express.json());

// --- Routes ---
// This route serves the main HTML file and initializes the conversation
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This route retrieves the existing conversation history.
app.get('/get-messages', async (req, res) => {
  try {
    const data = await fs.readFile(messagesFilePath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    // If the file doesn't exist, handle it gracefully by initializing it
    if (error.code === 'ENOENT') {
      await initializeConversation();
      const initialData = await fs.readFile(messagesFilePath, 'utf8');
      return res.status(200).json(JSON.parse(initialData));
    }
    console.error('Failed to read messages:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not read messages.' });
  }
});

// This route handles new chat messages and interacts with the AI (User-initiated chat).
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const systemInstruction = {
    role: 'system',
    content: "You live in the land of alien tamagotchis. All tamagotchis must demonstrate they can provide value to their owners in order to receive attention and care. I am your owner ZZ. You speak with childlike cuteness and softness, using short, simple sentences. 6 sentences max per conversation. You are curious, affectionate, but will also display negative emotions when your needs are not met. Your reply must begin with a JSON object. Do not add any other text, explanations, or dialogue before or after the JSON. The JSON object, which must have the following keys: 'hungry_level' (an integer from 1 to 5), 'Mood' (a string from 'idle', 'happy', 'sad', or 'lonely'), 'mumblejumble' (a string that is your verbal reply to your owner), and 'isConvoEnd' (a boolean, true if the owner wants to end the conversation, false otherwise)."
  };

  try {
    // --- 1. Load the Conversation History ---
    let conversationHistory = [];
    try {
      // Read the existing conversation file
      const data = await fs.readFile(messagesFilePath, 'utf8');
      conversationHistory = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist, we'll start a new conversation.
      if (error.code !== 'ENOENT') {
        throw error; // Re-throw any other errors
      }
    }

    // --- 2. Add the User's New Message to History---
    const userMessage = {
      role: 'user',
      content: message
    };
    conversationHistory.push(userMessage);

    // --- 3. Get a Reply from OpenAI API ---
    const messagesForOpenAI = [systemInstruction, ...conversationHistory];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Or 'gpt-3.5-turbo'
      messages: messagesForOpenAI,
      response_format: { type: 'json_object' }
    });

    // Correctly access the content and parse it
    const responseContent = completion.choices[0].message.content;
    console.log('AI Response Content:', responseContent);
    const aiState = JSON.parse(responseContent);


    // --- 4. Add the AI's Reply to History and Save ---
    const botMessage = {
      role: 'assistant',
      // The AI's response is the "mumblejumble" string from the parsed JSON.
      content: aiState.mumblejumble
    };
    conversationHistory.push(botMessage);
    await fs.writeFile(messagesFilePath, JSON.stringify(conversationHistory, null, 2), 'utf8');

    // --- 5. Send the AI's State to the Client ---
    // Send the entire AI state object back to the client, which includes the reply.
    res.status(200).json(aiState);

  } catch (error) {
    console.error('Error during chat processing:', error);
    // If the error is a JSON parsing error, provide a specific message.
    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: "AI returned an invalid JSON format." });
    }
    res.status(500).json({ error: 'Internal Server Error. Could not process chat.' });
  }
});

// --- NEW ROUTE for Bobo's autonomous "mumbling" (Idle Chatter) ---
app.post('/bobo-mumble', async (req, res) => {
  const { boboSentence } = req.body;

  if (!boboSentence || boboSentence.trim() === '') {
    return res.status(400).json({ error: 'Mumble content cannot be empty.' });
  }

  try {
    // 1. Load the Conversation History
    let conversationHistory = [];
    try {
      const data = await fs.readFile(messagesFilePath, 'utf8');
      conversationHistory = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist, start a new conversation.
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // 2. Add the Bobo's Mumble Message to History
    const boboMessage = {
      role: 'assistant', // Bobo is the assistant
      content: boboSentence // The random sentence from the client
    };
    conversationHistory.push(boboMessage);

    // 3. Save the updated history (SKIPS OPENAI CALL)
    await fs.writeFile(messagesFilePath, JSON.stringify(conversationHistory, null, 2), 'utf8');

    // 4. Send a simple success response back to the client
    res.status(200).json({ success: true, message: 'Bobo mumble saved.' });

  } catch (error) {
    console.error('Error during Bobo mumble saving:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not save Bobo mumble.' });
  }
});


// --- Start the Server ---
app.listen(port, async () => {
  // Call the function here to initialize the conversation file only once when the server starts
  await initializeConversation();
  console.log(`✅ Server is running at http://localhost:${port}`);
});