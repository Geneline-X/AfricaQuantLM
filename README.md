# GeniGuideSL - Offline AI Assistant for Sierra Leone

GeniGuideSL is a modular offline AI assistant designed specifically for users in Sierra Leone. It provides helpful information across multiple domains without requiring an internet connection after initial setup.

## Features

- **100% Offline Operation**: Once loaded, works completely without internet
- **Local Storage**: Conversations are saved locally on your device
- **Multiple Specialized Modes**:
  - 🧑🏽‍🏫 **Study Mode**: Educational assistance for students
  - 🌾 **Farming Mode**: Agricultural advice and techniques
  - 🏥 **Health Mode**: First aid and health education (not medical diagnosis)
  - ⚖️ **Law Mode**: Basic legal information and rights
  - 💼 **Career Guide**: Job preparation and entrepreneurship tips

## Technical Details

- Built using MediaPipe's LLM Inference API
- Powered by Gemma 3 1B-IT (quantized to INT4 for efficiency)
- Fully client-side processing - no data leaves your device

## Setup Instructions

1. Make sure you have the model file `gemma3-1b-it-int4.task` in the same directory as the application
2. Open `index.html` in a web browser
3. Wait for the model to load (this may take a moment)
4. Start interacting with the assistant!

## Usage Tips

- Select the appropriate mode for your question using the buttons at the top
- Clear conversation history with the "Clear Chat" button
- Press Enter to send your message (Shift+Enter for a new line)
- Each mode provides specialized assistance in its domain

## Development

GeniGuideSL is designed to be modular and extensible. The system uses specialized prompts for each mode to provide contextually relevant responses.

## License

This project includes components licensed under the Apache License, Version 2.0.
