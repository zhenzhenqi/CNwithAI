const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const statusEl = document.getElementById('status');
const messageContainer = document.getElementById('messageContainer');
const tamagotchiImage = document.querySelector('img');
const giveHugBtn = document.getElementById('giveHugBtn'); // Get the hug button element


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

/**
 * Handles the logic for sending a message to the server, displaying the response,
 * and updating the UI.
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
        // 2. Send the message to the server
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

// Event listener for submitting the form
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSendMessage(messageInput.value);
});

// Event listener for the "Give BoBo a hug" button
giveHugBtn.addEventListener('click', async () => {
    // 1. Display the hugs.gif for 10 seconds
    const originalSrc = tamagotchiImage.src;
    tamagotchiImage.src = '/images/hugs.gif';

    // Disable the button to prevent multiple clicks
    giveHugBtn.disabled = true;

    setTimeout(async () => {
        // After 10 seconds, revert to the previous image
        tamagotchiImage.src = originalSrc;
        // Re-enable the button
        giveHugBtn.disabled = false;
        // 2. Send the hug message to the server
        await handleSendMessage("ZZ hugs Bobo.");
    }, 10000); // 10000 milliseconds = 10 seconds
});


// Load all existing messages and set the initial image when the page first loads
document.addEventListener('DOMContentLoaded', () => {
    tamagotchiImage.src = '/images/idle.gif';
    fetchAndDisplayMessages();
});