// Import required modules
const express = require('express');
const fs = require('fs').promises; // Use the promise-based version of fs
const path = require('path');

// Initialize the Express app
const app = express();
const port = 3000;

// Path to the JSON file where messages will be stored
const messagesFilePath = path.join(__dirname, 'usermessages.json');

// --- Middleware ---

// 1. Serve static files (like your HTML and GIF) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 2. Enable the express app to parse JSON in the request body
app.use(express.json());

// --- Routes ---

// API endpoint to save a message
app.post('/save-message', async (req, res) => {
  const { message } = req.body;

  // Basic validation
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  try {
    let messages = [];
    // Try to read the existing messages file
    try {
      const data = await fs.readFile(messagesFilePath, 'utf8');
      messages = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist, we'll just start with an empty array.
      if (error.code !== 'ENOENT') {
        console.warn('Could not read or parse usermessages.json, will overwrite.', error);
      }
    }

    // Add the new message with a timestamp
    const newMessage = {
      text: message,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);

    // Write the updated array back to the file
    await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');

    // Send a success response back to the client
    res.status(200).json({ success: true, message: 'Message saved successfully.' });

  } catch (error) {
    // If any error occurs during the process, log it and send a server error response
    console.error('Failed to save message:', error);
    res.status(500).json({ error: 'Internal Server Error. Could not save message.' });
  }
});


// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});