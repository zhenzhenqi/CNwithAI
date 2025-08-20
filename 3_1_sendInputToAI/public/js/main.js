const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const statusEl = document.getElementById('status');
const messageContainer = document.getElementById('messageContainer');

/**
 * Fetches all messages from the server and displays them on the page.
 */
const fetchAndDisplayMessages = async () => {
    try {
        const response = await fetch('/get-messages');
        if (!response.ok) {
            throw new Error('Could not fetch messages.');
        }
        const messages = await response.json();

        // Clear the container before adding new messages
        messageContainer.innerHTML = '';

        if (messages.length === 0) {
            messageContainer.textContent = 'No messages have been saved yet.';
            return;
        }

        // Loop through messages and display them (newest first)
        messages.reverse().forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message-item';

            const textP = document.createElement('p');
            textP.textContent = msg.text;

            const timeSmall = document.createElement('small');
            // Format the date to be more readable
            timeSmall.textContent = new Date(msg.timestamp).toLocaleString();

            msgDiv.appendChild(textP);
            msgDiv.appendChild(timeSmall);

            messageContainer.appendChild(msgDiv);
        });

    } catch (err) {
        messageContainer.textContent = 'Error loading messages.';
        console.error(err);
    }
};

// Event listener for submitting the form
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value;

    try {
        const response = await fetch('/save-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (response.ok) {
            statusEl.textContent = 'Message saved!';
            statusEl.style.color = 'green';
            messageInput.value = '';
            // REFRESH the message list after a successful save
            fetchAndDisplayMessages();
        } else {
            const error = await response.json();
            statusEl.textContent = `Error: ${error.error}`;
            statusEl.style.color = 'red';
        }
    } catch (err) {
        statusEl.textContent = 'Network error';
        statusEl.style.color = 'red';
        console.error(err);
    }
});

// Load all existing messages when the page first loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayMessages);