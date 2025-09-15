const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const statusEl = document.getElementById('status');
const messageContainer = document.getElementById('messageContainer');

/**
 * Creates and appends a single message element to the message container.
 * @param {object} message - A message object with 'role' and 'content' properties.
 */
function displayMessage(message) {
    // If this is the first message, clear the initial text
    if (messageContainer.textContent.includes('Start the conversation!')) {
        messageContainer.innerHTML = '';
    }

    const msgDiv = document.createElement('div');
    // Add a CSS class based on the role for styling
    msgDiv.className = `message-item ${message.role}`;

    const textP = document.createElement('p');
    textP.textContent = message.content;

    msgDiv.appendChild(textP);
    messageContainer.appendChild(msgDiv);

    // Auto-scroll to the bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

/**
 * Fetches all messages from the server and displays them on the page.
 */
const fetchAndDisplayMessages = async () => {
    try {
        const response = await fetch('/get-messages');
        if (!response.ok) throw new Error('Could not fetch messages.');

        const messages = await response.json();

        // Clear the container before adding new messages
        messageContainer.innerHTML = '';

        if (messages.length === 0) {
            messageContainer.textContent = 'Start the conversation!';
            return;
        }

        // Loop through messages and display them
        messages.forEach(msg => {
            displayMessage(msg);
        });

    } catch (err) {
        messageContainer.textContent = 'Error loading messages.';
        console.error(err);
    }
};

// Event listener for submitting the form
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessageContent = messageInput.value;
    if (!userMessageContent.trim()) return; // Don't send empty messages

    // --- 1. Immediately display the user's message ---
    const userMessage = { role: 'user', content: userMessageContent };
    displayMessage(userMessage);
    messageInput.value = ''; // Clear input field
    statusEl.textContent = 'AI is thinking...';

    try {
        // --- 2. Send the message to the server ---
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessageContent })
        });

        if (!response.ok) throw new Error('Server responded with an error.');

        const data = await response.json();

        // --- 3. Display the AI's response ---
        const botMessage = { role: 'assistant', content: data.reply };
        displayMessage(botMessage);
        statusEl.textContent = ''; // Clear status

    } catch (err) {
        statusEl.textContent = 'Failed to get a response.';
        console.error(err);
    }
});

// Load all existing messages when the page first loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayMessages);