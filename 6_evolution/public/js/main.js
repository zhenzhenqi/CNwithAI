const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messageContainer = document.getElementById('messageContainer');
const tamagotchiImage = document.querySelector('img');
const giveHugBtn = document.getElementById('giveHugBtn');
const statusEl = document.getElementById('status');

// Variable to track the last chat activity time for idle chatter logic
let lastMessageTime = Date.now();

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

    // Update the last message time on display
    lastMessageTime = Date.now();
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

/**
 * Handles the logic for sending a user message to the server, displaying the response,
 * and updating the UI and Tamagotchi mood. Calls the /chat (AI) route.
 * @param {string} userMessageContent - The content of the user's message.
 */
const handleSendMessage = async (userMessageContent) => {
    if (!userMessageContent.trim()) return; // Don't send empty messages

    // 1. Immediately display the user's message
    const userMessage = { role: 'user', content: userMessageContent };
    displayMessage(userMessage);
    messageInput.value = ''; // Clear input field
    statusEl.textContent = 'BOBO is thinking...';

    try {
        // 2. Send the message to the /chat (AI) server route
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessageContent })
        });

        if (!response.ok) throw new Error('Server responded with an error.');

        // 3. Receive and parse the full JSON object from the server
        const data = await response.json();

        // 4. Update the image based on the 'Mood' attribute
        switch (data.Mood) {
            case 'idle':
                tamagotchiImage.src = '/images/idle.gif';
                break;
            case 'happy':
                tamagotchiImage.src = '/images/happy.gif';
                break;
            case 'sad':
                tamagotchiImage.src = '/images/sad.gif';
                break;
            case 'lonely':
                tamagotchiImage.src = '/images/lonely.gif';
                break;
            default:
                // Fallback image in case of an unexpected mood
                tamagotchiImage.src = '/images/idle.gif';
        }

        // 5. Now, reload the entire chatbox from the updated conversation.json
        await fetchAndDisplayMessages();
        statusEl.textContent = ''; // Clear status message

    } catch (err) {
        statusEl.textContent = 'Failed to get a response.';
        console.error(err);
    }
};

/**
 * Handles Bobo's autonomous idle chatter. Sends the mumble to the /bobo-mumble
 * server route for saving (no AI call), then updates the UI.
 * @param {string} boboSentence - The random sentence Bobo will say.
 */
const handleBoboMumble = async (boboSentence) => {
    try {
        // 1. Send the mumble to the dedicated /bobo-mumble server route
        const response = await fetch('/bobo-mumble', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boboSentence: boboSentence })
        });

        if (!response.ok) throw new Error('Server responded with an error during mumble save.');

        // 2. Display the message by reloading the entire chatbox
        await fetchAndDisplayMessages();

    } catch (err) {
        console.error('Failed to save Bobo mumble:', err);
    }
};

// Event listener for submitting the form (User-initiated chat)
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Use the AI interaction handler
    await handleSendMessage(messageInput.value);
});

// Event listener for the "Give BoBo a hug" button (User-initiated action)
giveHugBtn.addEventListener('click', async () => {
    // 1. Display the hugs.gif
    tamagotchiImage.src = '/images/hugs.gif';
    giveHugBtn.disabled = true;

    // Wait for the duration of the animation
    setTimeout(async () => {
        // 2. Send the hug message as a user input to the AI
        await handleSendMessage("ZZ hugs Bobo.");

        // 3. Re-enable the button *after* the chat process finishes
        giveHugBtn.disabled = false;

    }, 5000); // 5000 milliseconds = 5 seconds
});


// -----------------------------------------------------------------
// IDLE CHATTER LOGIC
// -----------------------------------------------------------------

// List of sentences Bobo can randomly "mumble"
const boboSentences = [
    "Bobo is hungry.",
    "Bobo is lonely.",
    "Bobo has a secret to tell.",
    "It is quiet.",
    "Do you want to play?",
    "Bobo likes you."
];

const checkIdleTime = () => {
    // Check if more than 5 seconds (5000ms) have passed since the last message
    if (Date.now() - lastMessageTime > 5000) {
        // Pick a random sentence
        const randomIndex = Math.floor(Math.random() * boboSentences.length);
        const randomSentence = boboSentences[randomIndex];

        // Use the dedicated mumble handler (skips AI)
        handleBoboMumble(randomSentence);
    }
}

// Start the idle timer, checking every 1000 milliseconds (1 second)
setInterval(checkIdleTime, 1000);


// Load all existing messages and set the initial image when the page first loads
document.addEventListener('DOMContentLoaded', () => {
    tamagotchiImage.src = '/images/idle.gif';
    fetchAndDisplayMessages();
});