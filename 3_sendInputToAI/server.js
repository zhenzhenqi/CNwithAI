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
// called once when the page loads to populate the chat interface with the existing conversation.
app.get('/get-messages', async (req, res) => {
  try {
    // Read the file's contents
    const data = await fs.readFile(messagesFilePath, 'utf8');
    // Parse the JSON data and send it
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    // If the file doesn't exist yet, just send back an empty array
    if (error.code === 'ENOENT') {
      return res.status(200).json([]);
    }
    // For any other error, send a server error response
    console.error('Failed to read messages:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not read messages.' });
  }
});

// called every time the user sends a new message to continue the conversation.
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Basic validation
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const systemInstruction = {
    role: 'system',
    content: "You are an alien creature that is equivalent to a 3-year-old child. Talk with cuteness and softness. Keep your responses short and simple, like a child would speak. You are curious about the world."
  };

  try {
    // --- 1. Prepare the Conversation History ---
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

    // --- 2. Add the User's New Message ---
    const userMessage = {
      role: 'user',
      content: message
    };
    conversationHistory.push(userMessage);

    // --- 3. Get a Reply from OpenAI API ---
    // Create the final messages array for the API by combining the system message and the history.
    const messagesForOpenAI = [systemInstruction, ...conversationHistory];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Or 'gpt-3.5-turbo'
      messages: messagesForOpenAI // This is the fixed line
    });

    const botMessage = completion.choices[0].message;

    // --- 4. Add the AI's Reply and Save ---
    conversationHistory.push(botMessage);
    await fs.writeFile(messagesFilePath, JSON.stringify(conversationHistory, null, 2), 'utf8');

    // --- 5. Send the AI's Reply to the Client ---
    res.status(200).json({ reply: botMessage.content });

  } catch (error) {
    // If any error occurs, log it and send a server error response
    console.error('Error during chat processing:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not process chat.' });
  }
});



// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});