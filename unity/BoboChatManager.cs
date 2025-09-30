using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic; // Required for List

public class BoboChatManager : MonoBehaviour
{
    // --- Public References (Drag and Drop in Inspector) ---
    public Button hugButton;
    public Animator boBoAnimator; // Character's Animator component
    public float idleTimeThreshold = 5.0f; // Time in seconds before Bobo mumbles

    // --- Internal/Assumed References ---
    // Assuming 'chatManager' is a reference to the component that handles the API calls.
    // Replace 'YourChatManagerType' with the actual class name (e.g., 'APIChatHandler').
    private YourChatManagerType chatManager;

    // --- State Tracking ---
    private float lastMessageTime;
    private bool isChatting = false; // Flag to stop idle chatter while an interaction is happening

    // --- Bobo's Idle Sentences ---
    private List<string> boboSentences = new List<string>
    {
        "Bobo is hungry.",
        "Bobo is lonely.",
        "Bobo has a secret to tell.",
        "It is quiet.",
        "Do you want to play?",
        "Bobo likes you."
    };

    // Assuming ChatMessage is defined elsewhere as a serializable class/struct
    public struct ChatMessage
    {
        public string role;
        public string content;
    }

    void Start()
    {
        // Initialize the last message time to start the idle timer immediately
        lastMessageTime = Time.time;

        // Find or get the chat manager component
        chatManager = FindObjectOfType<YourChatManagerType>();
        if (chatManager == null)
        {
            Debug.LogError("Chat Manager not found! Idle chatter will not work.");
        }
    }

    void Update()
    {
        // Check for idle time only if we aren't currently waiting for a response
        if (!isChatting && Time.time > lastMessageTime + idleTimeThreshold)
        {
            HandleBoboMumble();
            // Reset the timer immediately after a mumble to prevent rapid-fire messages
            lastMessageTime = Time.time;
        }
    }

    // --- 1. User-Initiated Hug Action ---
    public void OnHugButtonClicked()
    {
        // Disable the button to prevent spamming
        hugButton.interactable = false;

        // Set the "Hug" trigger to activate the animation
        boBoAnimator.SetTrigger("Hug");

        // Set the flag to true to pause idle chatter
        isChatting = true;

        // Start the Coroutine to handle the delay and API call
        StartCoroutine(HandleHugAndChat());
    }

    private IEnumerator HandleHugAndChat()
    {
        // Wait for 10 seconds (or the duration of your animation).
        yield return new WaitForSeconds(10f);

        // Create the user message
        var userMessage = new ChatMessage
        {
            role = "user",
            content = "ZZ hugs BoBo."
        };

        // Send the message to the API handler
        // IMPORTANT: The chat manager MUST call the 'chat' API route.
        chatManager.SendMessage(userMessage);

        // Note: You should have a callback in your chatManager that calls a 
        // function like 'OnChatResponseReceived()' to set isChatting = false
        // and update lastMessageTime. For simplicity, we'll set it here.
        yield return new WaitForSeconds(2f); // Simulate waiting for API response

        // Update state after interaction is complete
        isChatting = false;
        lastMessageTime = Time.time;

        // Re-enable the button
        hugButton.interactable = true;
    }

    // --- 2. Bobo's Autonomous Idle Mumble ---
    private void HandleBoboMumble()
    {
        // Pick a random sentence
        int randomIndex = Random.Range(0, boboSentences.Count);
        string randomSentence = boboSentences[randomIndex];

        // Create the message object
        var boboMessage = new ChatMessage
        {
            role = "assistant",
            content = randomSentence
        };

        // Send the message to the API handler.
        // IMPORTANT: The chat manager MUST call the dedicated '/bobo-mumble' route 
        // on the server, ensuring the AI is NOT called.
        chatManager.SendMumble(boboMessage);

        // The display/log of the mumble should happen within the chatManager 
        // or a callback after the server confirms the save.
    }

    // --- 3. Public Method to Reset Timer on Any Message ---
    // Your actual chat message receiving component should call this whenever 
    // a user message OR an AI response is processed.
    public void OnMessageReceived()
    {
        lastMessageTime = Time.time;
        isChatting = false;
    }
}