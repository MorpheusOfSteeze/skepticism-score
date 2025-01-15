# AI16Z ELIZA Clone

A modern implementation of the classic ELIZA chatbot, inspired by AI16Z. This chatbot uses pattern matching and simple natural language processing to engage in conversation with users, simulating a Rogerian psychotherapist. Now with X.com (Twitter) integration!

## Features

- Pattern-based conversation responses
- First/second person word reflection
- Natural language understanding
- Therapeutic-style responses
- Simple command-line interface
- X.com (Twitter) integration - post conversations to your timeline

## Requirements

1. Python 3.6+
2. Required packages (install via `pip install -r requirements.txt`):
   - tweepy (for X.com integration)

## X.com Integration Setup

To enable X.com integration, you need to:

1. Create a developer account at https://developer.twitter.com
2. Create a new app and get your API credentials
3. Set the following environment variables:
   ```bash
   export TWITTER_API_KEY='your_api_key'
   export TWITTER_API_SECRET='your_api_secret'
   export TWITTER_ACCESS_TOKEN='your_access_token'
   export TWITTER_ACCESS_TOKEN_SECRET='your_access_token_secret'
   export USE_TWITTER='true'
   ```

## How to Run

1. Make sure you have Python installed on your system
2. Clone this repository
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Set up X.com integration as described above
5. Run the chatbot:
   ```bash
   python eliza.py
   ```

## Usage

- Start typing your messages and press Enter
- The chatbot will respond based on pattern matching
- If X.com integration is enabled, conversations will be posted to your timeline
- Type 'quit', 'bye', or 'goodbye' to end the conversation

## Example Conversation

```
ELIZA: Hello. How are you feeling today?
YOU: I am feeling sad
ELIZA: How long have you been feeling sad?
YOU: I don't know what to do
ELIZA: Why don't you tell me more about what's troubling you?
```

## Note

This is a simple implementation meant for educational purposes. The responses are template-based and the bot does not have true understanding or memory of the conversation. When using X.com integration, be mindful of rate limits and the public nature of posted content. 