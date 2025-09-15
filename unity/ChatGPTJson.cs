using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using Newtonsoft.Json; // Make sure you have the Newtonsoft.Json library installed

namespace OpenAI
{
    public class ChatGPTJson : MonoBehaviour
    {
        [SerializeField] private InputField inputField;
        [SerializeField] private Button button;
        [SerializeField] private ScrollRect scroll;

        [SerializeField] private RectTransform sent;
        [SerializeField] private RectTransform received;
        [SerializeField] private Animator botAnimator; // Reference to the bot's Animator

        private float height;
        private OpenAIApi openai = new OpenAIApi();

        private List<ChatMessage> messages = new List<ChatMessage>();
        // Updated prompt to match the user's instructions for the AI
        private string prompt = "You live in the land of alien tamagotchis. All tamagotchis must demonstrate they can provide value to their owners in order to receive attention and care. I am your owner. You speak with childlike cuteness and softness, using short, simple sentences. 6 sentences max per conversation. You are curious, affectionate, but with your own needs and agency. Based on the conversation history with your owner, return your current state as a JSON object. ONLY return the JSON object, which must have the following keys: 'hungry_level' (an integer from 1 to 5), 'Mood' (a string from 'idle', 'happy', 'sad', or 'lonely'), 'numblejumble' (a string that is your verbal reply to your owner), and 'isConvoEnd' (a boolean, true if the owner wants to end the conversation, false otherwise).";

        // C# class to represent the JSON structure
        private class TamagotchiState
        {
            public int hungry_level;
            public string Mood;
            public string numblejumble;
            public bool isConvoEnd;
        }

        private void Start()
        {
            button.onClick.AddListener(SendReply);
        }

        private void AppendMessage(ChatMessage message)
        {
            scroll.content.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, 0);

            var item = Instantiate(message.Role == "user" ? sent : received, scroll.content);
            item.GetChild(0).GetChild(0).GetComponent<Text>().text = message.Content;
            item.anchoredPosition = new Vector2(0, -height);
            LayoutRebuilder.ForceRebuildLayoutImmediate(item);
            height += item.sizeDelta.y;
            scroll.content.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, height);
            scroll.verticalNormalizedPosition = 0;
        }

        private async void SendReply()
        {
            var newMessage = new ChatMessage()
            {
                Role = "user",
                Content = inputField.text
            };

            // Do not display the user's message, as the AI only returns a JSON object.
            // AppendMessage(newMessage);

            if (messages.Count == 0) newMessage.Content = prompt + "\n" + inputField.text;

            messages.Add(newMessage);

            button.enabled = false;
            inputField.text = "";
            inputField.enabled = false;

            // Complete the instruction
            var completionResponse = await openai.CreateChatCompletion(new CreateChatCompletionRequest()
            {
                Model = "gpt-4o-mini",
                Messages = messages
            });

            if (completionResponse.Choices != null && completionResponse.Choices.Count > 0)
            {
                var message = completionResponse.Choices[0].Message;
                message.Content = message.Content.Trim();

                // Parse the JSON response
                ParseAndAnimate(message.Content);

                // Add the response message to the history, but don't display it directly
                // messages.Add(message);
            }
            else
            {
                Debug.LogWarning("No text was generated from this prompt.");
            }

            button.enabled = true;
            inputField.enabled = true;
        }

        private void ParseAndAnimate(string jsonString)
        {
            try
            {
                // Deserialize the JSON string into our C# class
                TamagotchiState state = JsonConvert.DeserializeObject<TamagotchiState>(jsonString);

                // Display the NPC's verbal reply (numblejumble)
                var replyMessage = new ChatMessage()
                {
                    Role = "assistant",
                    Content = state.numblejumble
                };
                AppendMessage(replyMessage);

                // Control the Animator based on the parsed values
                if (botAnimator != null)
                {
                    // Set a float parameter for hungry_level
                    botAnimator.SetFloat("HungryLevel", state.hungry_level);

                    // Set a trigger or a string/int parameter for the Mood
                    // This assumes you have an Animator with these parameters
                    switch (state.Mood.ToLower())
                    {
                        case "idle":
                            botAnimator.SetTrigger("Idle");
                            break;
                        case "happy":
                            botAnimator.SetTrigger("Happy");
                            break;
                        case "sad":
                            botAnimator.SetTrigger("Sad");
                            break;
                        case "lonely":
                            botAnimator.SetTrigger("Lonely");
                            break;
                    }
                }
            }
            catch (JsonException e)
            {
                Debug.LogError("Failed to parse JSON: " + e.Message + "\nJSON String: " + jsonString);
            }
        }
    }
}