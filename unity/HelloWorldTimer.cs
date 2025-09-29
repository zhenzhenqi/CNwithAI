using UnityEngine;
using System.Collections; // Required for Coroutines

public class HelloWorldTimer : MonoBehaviour
{
    // The time delay in seconds (5.0f is equivalent to 5000ms)
    private const float TimeDelay = 5.0f;

    // Variable to hold the reference to the running Coroutine
    private Coroutine helloWorldCoroutine;

    void Start()
    {
        // Start the initial countdown when the game starts
        StartTimer();
    }

    void Update()
    {
        // Check for a left mouse button click (Input.GetMouseButtonDown(0))
        if (Input.GetMouseButtonDown(0))
        {
            HandleDocumentClick();
        }
    }

    /**
     * Coroutine to wait for the delay and then log the message.
     */
    IEnumerator HelloWorldInterval()
    {
        // This loop makes the log repeat indefinitely
        while (true)
        {
            // 1. PAUSE: Wait for 5 seconds
            yield return new WaitForSeconds(TimeDelay);

            // 2. RESUME: Log the message
            Debug.Log("Hello World");
        }
    }

    /**
     * Function to start or restart the timer.
     */
    void StartTimer()
    {
        // Start the Coroutine and store its reference
        helloWorldCoroutine = StartCoroutine(HelloWorldInterval());
    }

    /**
     * Function to handle the mouse click event, stopping and restarting the timer.
     */
    void HandleDocumentClick()
    {
        // 1. Clear the existing timer (Coroutines are stopped via StopCoroutine)
        if (helloWorldCoroutine != null)
        {
            StopCoroutine(helloWorldCoroutine);
            Debug.Log("Mouse clicked! Timer reset.");
        }

        // 2. Start a new timer, effectively resetting the 5-second rule
        StartTimer();
    }
}