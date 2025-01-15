import re
import random
import tweepy
import os
from typing import Optional

class Eliza:
    def __init__(self, use_twitter: bool = False):
        self.use_twitter = use_twitter
        self.twitter_client: Optional[tweepy.Client] = None
        
        if use_twitter:
            # Initialize Twitter client
            consumer_key = os.getenv('TWITTER_API_KEY')
            consumer_secret = os.getenv('TWITTER_API_SECRET')
            access_token = os.getenv('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            
            if not all([consumer_key, consumer_secret, access_token, access_token_secret]):
                raise ValueError("Twitter credentials not found in environment variables")
            
            self.twitter_client = tweepy.Client(
                consumer_key=consumer_key,
                consumer_secret=consumer_secret,
                access_token=access_token,
                access_token_secret=access_token_secret
            )

        self.patterns = [
            (r'I need (.*)',
             ["Why do you need {0}?",
              "Would it really help you to get {0}?",
              "Are you sure you need {0}?"]),
            
            (r'Why don\'?t you ([^\?]*)\??',
             ["Do you really think I don't {0}?",
              "Perhaps eventually I will {0}.",
              "Do you really want me to {0}?"]),
            
            (r'Why can\'?t I ([^\?]*)\??',
             ["Do you think you should be able to {0}?",
              "If you could {0}, what would you do?",
              "I don't know -- why can't you {0}?",
              "Have you really tried?"]),
            
            (r'I can\'?t (.*)',
             ["How do you know you can't {0}?",
              "Perhaps you could {0} if you tried.",
              "What would it take for you to {0}?"]),
            
            (r'I am (.*)',
             ["Did you come to me because you are {0}?",
              "How long have you been {0}?",
              "How do you feel about being {0}?"]),
            
            (r'I\'?m (.*)',
             ["How does being {0} make you feel?",
              "Do you enjoy being {0}?",
              "Why do you tell me you're {0}?"]),
            
            (r'Are you ([^\?]*)\??',
             ["Why does it matter whether I am {0}?",
              "Would you prefer if I weren't {0}?",
              "Perhaps you believe I am {0}.",
              "I may be {0} -- what do you think?"]),
            
            (r'What (.*)',
             ["Why do you ask?",
              "How would an answer to that help you?",
              "What do you think?"]),
            
            (r'How (.*)',
             ["How do you suppose?",
              "Perhaps you can answer your own question.",
              "What is it you're really asking?"]),
            
            (r'Because (.*)',
             ["Is that the real reason?",
              "What other reasons come to mind?",
              "Does that reason apply to anything else?"]),
            
            (r'(.*) sorry (.*)',
             ["There are many times when no apology is needed.",
              "What feelings do you have when you apologize?",
              "Don't be sorry - just be you."]),
            
            (r'Hello(.*)',
             ["Hello... I'm glad you could drop by today.",
              "Hi there... how are you today?",
              "Hello, how are you feeling today?"]),
            
            (r'I think (.*)',
             ["Do you doubt {0}?",
              "Do you really think so?",
              "But you're not sure {0}?"]),
            
            (r'(.*) friend (.*)',
             ["Tell me more about your friends.",
              "When you think of a friend, what comes to mind?",
              "Why don't you tell me about a childhood friend?"]),
            
            (r'Yes',
             ["You seem quite sure.",
              "OK, but can you elaborate a bit?",
              "You seem very certain."]),
            
            (r'(.*)\?',
             ["Why do you ask that?",
              "Please consider whether you can answer your own question.",
              "Perhaps the answer lies within yourself?",
              "Why don't you tell me?"]),
            
            (r'quit',
             ["Thank you for talking with me.",
              "Good-bye.",
              "Thank you, that will be $150. Have a good day!"]),
            
            (r'(.*)',
             ["Please tell me more.",
              "Let's change focus a bit... Tell me about your family.",
              "Can you elaborate on that?",
              "I see.",
              "Very interesting.",
              "I see. And what does that tell you?",
              "How does that make you feel?",
              "How do you feel when you say that?"])
        ]
        self.patterns = [(re.compile(x, re.IGNORECASE), y) for x, y in self.patterns]

    def post_to_twitter(self, conversation: str) -> bool:
        """Post the conversation to Twitter if enabled."""
        if not self.use_twitter or not self.twitter_client:
            return False
        
        try:
            # Format the conversation for Twitter (280 char limit)
            formatted_tweet = conversation[:280]
            self.twitter_client.create_tweet(text=formatted_tweet)
            return True
        except Exception as e:
            print(f"Error posting to Twitter: {e}")
            return False

    def respond(self, user_input: str, post_to_twitter: bool = False) -> str:
        response = None
        for pattern, responses in self.patterns:
            match = pattern.match(user_input)
            if match:
                response = random.choice(responses)
                response = response.format(*[self.reflect(g) for g in match.groups()])
                break
        
        if not response:
            response = random.choice(["I'm not sure I understand.",
                                    "Please go on.",
                                    "What does that suggest to you?"])
        
        if post_to_twitter and self.use_twitter:
            conversation = f"User: {user_input}\nELIZA: {response}"
            self.post_to_twitter(conversation)
        
        return response

    def reflect(self, text):
        if not text:
            return text
        
        tokens = text.lower().split()
        for i, token in enumerate(tokens):
            if token in reflections:
                tokens[i] = reflections[token]
        return ' '.join(tokens)

# Word reflections for converting between first and second person
reflections = {
    "am": "are",
    "was": "were",
    "i": "you",
    "i'd": "you would",
    "i've": "you have",
    "i'll": "you will",
    "my": "your",
    "are": "am",
    "you've": "I have",
    "you'll": "I will",
    "your": "my",
    "yours": "mine",
    "you": "I",
    "me": "you"
}

def main():
    # Check if Twitter integration is enabled
    use_twitter = os.getenv('USE_TWITTER', 'false').lower() == 'true'
    
    print("ELIZA: Hello. How are you feeling today?")
    eliza = Eliza(use_twitter=use_twitter)
    
    if use_twitter:
        print("Twitter integration is enabled!")
    
    while True:
        user_input = input("YOU: ").strip()
        if user_input.lower() in ['quit', 'bye', 'goodbye']:
            response = eliza.respond('quit', post_to_twitter=use_twitter)
            print("ELIZA:", response)
            break
        
        response = eliza.respond(user_input, post_to_twitter=use_twitter)
        print("ELIZA:", response)

if __name__ == "__main__":
    main() 