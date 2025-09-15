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

console.log('API Key being used:', process.env.OPENAI_API_KEY);

// Path to the JSON file where messages will be stored
const messagesFilePath = path.join(__dirname, 'conversation.json');

// --- Middleware ---

// 1. Serve static files (like your HTML and GIF) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 2. Enable the express app to parse JSON in the request body
app.use(express.json());

// --- Routes ---
// This route retrieves the existing conversation history.
app.get('/get-messages', async (req, res) => {
  try {
    const data = await fs.readFile(messagesFilePath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(200).json([]);
    }
    console.error('Failed to read messages:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not read messages.' });
  }
});

// This route handles new chat messages and interacts with the AI.
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const systemInstruction = {
    role: 'system',
    content: "You live in the land of alien tamagotchis. All tamagotchis must demonstrate they can provide value to their owners in order to receive attention and care.  I am your owner. You speak with childlike cuteness and softness, using short, simple sentences. 6 sentences max per conversation. You are curious, affectionate, but with your own needs and agency. Your reply must begin with a JSON object. Do not add any other text, explanations, or dialogue before or after the JSON. The JSON object, which must have the following keys: 'hungry_level' (an integer from 1 to 5), 'Mood' (a string from 'idle', 'happy', 'sad', or 'lonely'), 'mumblejumble' (a string that is your verbal reply to your owner), and 'isConvoEnd' (a boolean, true if the owner wants to end the conversation, false otherwise)."
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
      response_format: { type: 'json_object' } // only works with gpt-4o and gpt-3.5-turbo.
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



// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});