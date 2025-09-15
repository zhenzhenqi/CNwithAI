// Import the Express framework module, which simplifies creating web servers and handling routes.
const express = require('express');

// Import Node.js's built-in 'path' module, necessary for working with file and directory paths reliably across different operating systems.
const path = require('path');

// Initialize a new instance of an Express application by calling the imported express function.
const app = express();

// Define a constant variable 'port' to hold the port number where the server will listen for connections (3000 is a common development port).
const port = 3000;

// --- Middleware Configuration ---

// the express.static middleware looks for the file path /index.html inside the folder you specified.
// It searches for public/index.html.
app.use(express.static(path.join(__dirname, 'public')));

// --- Server Activation ---

// Start the server and make it listen for incoming connections on the previously defined port.
app.listen(port, () => {
  // Execute this callback function once the server is successfully running.
  // Log a confirmation message to the console, showing the URL to access the server in a browser.
  console.log(`Server running at http://localhost:${port}`);
});