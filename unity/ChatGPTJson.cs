private async void SendReply()
{
    var newMessage = new ChatMessage()
    {
        Role = "user",
        Content = inputField.text
    };
    
    // Note: The user's message is not appended to the chat UI here.
    // It's part of the conversation history sent to the API, but the UI will
    // only display the numblejumble from the JSON response.

    var messagesToSend = new List<ChatMessage>(messages);
    if (messagesToSend.Count == 0)
    {
        // Add the system prompt and the user's first message with the prompt.
        messagesToSend.Add(new ChatMessage() { Role = "system", Content = prompt });
        messagesToSend.Add(newMessage);
    }
    else
    {
        // For subsequent messages, just add the new user message.
        messagesToSend.Add(newMessage);
    }
    
    button.enabled = false;
    inputField.text = "";
    inputField.enabled = false;
    
    // Complete the instruction with JSON mode enabled
    var completionResponse = await openai.CreateChatCompletion(new CreateChatCompletionRequest()
    {
        Model = "gpt-4o-mini",
        Messages = messagesToSend,
        ResponseFormat = new ResponseFormat() { Type = "json_object" }
    });

    if (completionResponse.Choices != null && completionResponse.Choices.Count > 0)
    {
        var message = completionResponse.Choices[0].Message;
        message.Content = message.Content.Trim();
        
        // Parse the JSON response
        ParseAndAnimate(message.Content);
        
        // Add the parsed message to the conversation history for the next turn.
        // This is important for the AI to maintain context.
        messages.Add(newMessage); // Add the user's message
        messages.Add(message);     // Add the assistant's JSON response
    }
    else
    {
        Debug.LogWarning("No text was generated from this prompt.");
    }

    button.enabled = true;
    inputField.enabled = true;
}