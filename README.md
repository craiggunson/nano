# nano

Local chat app powered by Chrome's on-device Gemini Nano APIs.

Live demo: https://craiggunson.github.io/nano.github.io/

## What it does

- Runs a browser-based chat interface backed by the local Nano model
- Supports multi-turn conversations in a persistent session
- Lets you set system prompt, temperature, and top-k before starting a session
- Keeps chats private by running on-device (when the model/API is available)

## Requirements

- Chrome with built-in AI APIs available (Dev/Canary is usually the easiest path)
- Gemini Nano model installed via chrome://components
- Relevant flags enabled (for example prompt API flags)

## Usage

1. Open the page.
2. Wait for the status badge to show readiness.
3. Set your system prompt and generation settings.
4. Send messages in the chat panel.
5. Use New Chat Session to reset model context.
