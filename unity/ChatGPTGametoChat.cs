using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class ChatGPTGametoChat : MonoBehaviour
{
    public Button hugButton;
    public Animator boBoAnimator; // Make sure this is linked to your character's Animator component

    public void OnHugButtonClicked()
    {
        // Disable the button to prevent spamming
        hugButton.interactable = false;

        // Set the "Hug" trigger to activate the animation
        boBoAnimator.SetTrigger("Hug");

        // Start the Coroutine to handle the delay and API call
        StartCoroutine(HandleHugAndChat());
    }

    private IEnumerator HandleHugAndChat()
    {
        // Wait for 10 seconds. The animation will be playing during this time.
        yield return new WaitForSeconds(10f);

        // Reset the animation to the default state.
        // This assumes your transitions from Hugs to Idle/Happy are handled correctly in the Animator.
        // Or you can set a trigger to return to Idle: boBoAnimator.SetTrigger("Idle");

        // Create the user message
        var userMessage = new ChatMessage
        {
            role = "user",
            content = "ZZ hugs BoBo."
        };

        // Send the message to the API handler
        chatManager.SendMessage(userMessage);

        // Re-enable the button
        hugButton.interactable = true;
    }
}