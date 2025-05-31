// Copyright 2024 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// ---------------------------------------------------------------------------------------- //

import {FilesetResolver, LlmInference} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai';

// DOM Elements
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const clearChatButton = document.getElementById('clear-chat');
const modeButtons = document.querySelectorAll('.mode-btn');
const currentModeIcon = document.getElementById('current-mode-icon');
const currentModeTitle = document.getElementById('current-mode-title');
const currentModeDescription = document.getElementById('current-mode-description');

// Landing page elements
const landingPage = document.getElementById('landing-page');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

// Configuration
const modelFileName = 'gemma3-1b-it-int4.task';
const LOCAL_STORAGE_KEY = 'geniGuideSL_history';

// Efficient markdown parser with streaming support
const markdownParser = {
  parse: function(text) {
    // Process the text in a single pass for better performance
    return text
      // Convert bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
      // Convert italic text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Convert inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Convert bullet lists (simple implementation)
      .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
      
      // Convert line breaks
      .replace(/\n/g, '<br>');
  }
};

// Application state
let llmInference;
let currentMode = 'study';
let isGenerating = false;
let chatHistory = {};

// Mode definitions
const modes = {
  study: {
    icon: '🧑🏽‍🏫',
    title: 'Study Mode',
    description: 'Ask questions about school subjects, get explanations on difficult topics, and receive help with homework.',
    systemPrompt: 'You are an educational assistant helping students in Sierra Leone. Provide clear, simple explanations for academic topics. Focus on being helpful for primary and secondary school subjects. Keep explanations concise and easy to understand, using simple language.'
  },
  farming: {
    icon: '🌾',
    title: 'Farming Mode',
    description: 'Get advice on farming techniques, crop disease identification, and weather planning tips.',
    systemPrompt: 'You are a farming advisor for people in Sierra Leone. Provide practical advice on farming techniques suitable for West African climate and soil conditions. Help with crop disease identification, sustainable farming practices, and seasonal planning.'
  },
  health: {
    icon: '🏥',
    title: 'Health Mode',
    description: 'Learn about first-aid, common symptoms, and hygiene education. Not for medical diagnosis.',
    systemPrompt: 'You are a health education assistant for people in Sierra Leone. Provide information about first aid, hygiene practices, and general wellness. DO NOT provide medical diagnosis or prescribe treatments. Always advise seeking professional medical help for health concerns.'
  },
  law: {
    icon: '⚖️',
    title: 'Law Mode',
    description: 'Understand basic rights in labor, land, and family law applicable in Sierra Leone.',
    systemPrompt: 'You are a basic legal information provider for people in Sierra Leone. Help users understand their basic rights regarding labor laws, land ownership, and family law. Provide general information about legal processes and rights.'
  },
  career: {
    icon: '💼',
    title: 'Career Guide',
    description: 'Get CV tips, job preparation advice, entrepreneurship ideas, and application guidance.',
    systemPrompt: 'You are a career advisor for people in Sierra Leone. Provide practical advice on resume writing, job interview preparation, small business ideas, and educational opportunities. Focus on skills development and local job market insights.'
  }
};

/**
 * Initialize the application
 */
async function initApp() {
  // Make sure landing page is visible first
  landingPage.style.opacity = '1';
  landingPage.classList.remove('hidden');
  
  // Reset loading bar
  loadingBar.style.width = '0%';
  loadingText.textContent = 'Starting up...';
  
  // Load chat history from localStorage
  loadChatHistory();
  
  // Initialize the current mode
  updateModeUI(currentMode);
  
  // Display chat history for current mode
  displayChatHistory();
  
  // Initialize the LLM model
  try {
    // Update loading text
    loadingText.textContent = 'Initializing AI environment...';
    updateLoadingProgress(10);
    
    const genaiFileset = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm');
    
    // Update loading progress
    loadingText.textContent = 'Preparing AI model...';
    updateLoadingProgress(30);
    
    // Initialize chat history for all modes if they don't exist
    Object.keys(modes).forEach(mode => {
      if (!chatHistory[mode]) {
        chatHistory[mode] = [];
      }
    });
    
    // Create welcome message for current mode if it's empty
    if (!chatHistory[currentMode] || chatHistory[currentMode].length === 0) {
      addAssistantMessage(`Welcome to ${modes[currentMode].title}! I'm here to help you with ${modes[currentMode].description.toLowerCase().split('.')[0]}. What would you like to know?`);
    }
    
    // Update loading text
    loadingText.textContent = 'Loading Gemma AI model... This may take a moment.';
    updateLoadingProgress(50);
    
    // Initialize LLM with options
    llmInference = await LlmInference.createFromOptions(genaiFileset, {
      baseOptions: {modelAssetPath: modelFileName},
      maxTokens: 2048,  // Increased token limit for more comprehensive responses
      temperature: 0.7,  // Slightly reduced temperature for more focused responses
    });
    
    // Update loading progress
    loadingText.textContent = 'Almost ready...';
    updateLoadingProgress(90);
    
    // Short delay to ensure UI is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Final loading progress
    updateLoadingProgress(100);
    loadingText.textContent = 'Ready!';
    
    // Hide landing page with a smooth transition
    setTimeout(() => {
      landingPage.style.opacity = '0';
      setTimeout(() => {
        landingPage.classList.add('hidden');
        // Ensure app container is visible
        document.getElementById('app-container').classList.remove('hidden');
        // Fade in app container
        setTimeout(() => {
          document.getElementById('app-container').style.opacity = '1';
        }, 50);
      }, 500);
    }, 800);
    
    // Enable input once model is loaded
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
    userInput.disabled = false;
  } catch (error) {
    console.error('Error initializing model:', error);
    loadingText.textContent = 'Error loading model. Please refresh the page and try again.';
    updateLoadingProgress(100, true); // Show error state in loading bar
    addAssistantMessage('Sorry, there was an error loading the AI model. Please refresh the page and try again.');
  }
}

/**
 * Update the loading progress bar
 */
function updateLoadingProgress(percentage, isError = false) {
  loadingBar.style.width = `${percentage}%`;
  
  if (isError) {
    loadingBar.style.backgroundColor = '#ea4335'; // Red color for error
    document.querySelectorAll('.loader-circle').forEach(circle => {
      circle.style.backgroundColor = '#ea4335';
      circle.style.animationPlayState = 'paused';
    });
  }
  
  // When loading is complete, hide the loader animation
  if (percentage === 100 && !isError) {
    setTimeout(() => {
      document.querySelector('.loader').style.opacity = '0';
      document.querySelector('.loader').style.height = '0';
      document.querySelector('.loader').style.marginBottom = '0';
      document.querySelector('.loading-text').style.fontWeight = 'bold';
      document.querySelector('.loader-logo').style.transform = 'scale(1.2)';
      document.querySelector('.loader-logo').style.color = '#4CAF50';
    }, 500);
  }
}

/**
 * Update the UI to reflect the current mode
 */
function updateModeUI(mode) {
  // Validate that the mode exists
  if (!modes[mode]) {
    console.error(`Mode ${mode} does not exist. Defaulting to study mode.`);
    mode = 'study';
    currentMode = 'study';
  }
  
  // Update active button
  modeButtons.forEach(button => {
    if (button.dataset.mode === mode) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update mode info section
  currentModeIcon.textContent = modes[mode].icon;
  currentModeTitle.textContent = modes[mode].title;
  currentModeDescription.textContent = modes[mode].description;
  
  // Reset input field
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Re-enable input if it was disabled
  if (!llmInference) {
    // If model isn't loaded yet, keep disabled
    sendButton.disabled = true;
    userInput.disabled = true;
  } else if (!isGenerating) {
    // If not currently generating, enable input
    sendButton.disabled = false;
    userInput.disabled = false;
  }
}

/**
 * Display chat history for the current mode
 */
function displayChatHistory() {
  // Clear chat display
  chatMessages.innerHTML = '';
  
  // Add messages from history if they exist
  if (chatHistory[currentMode] && chatHistory[currentMode].length > 0) {
    chatHistory[currentMode].forEach(message => {
      if (message.role === 'user') {
        addUserMessage(message.content, false);
      } else {
        addAssistantMessage(message.content, false);
      }
    });
  }
  
  // Scroll to bottom of chat
  scrollToBottom();
}

/**
 * Add a user message to the chat
 */
function addUserMessage(text, saveToHistory = true) {
  // Check if this is a duplicate message (to prevent double submissions)
  const lastMessage = chatHistory[currentMode] && chatHistory[currentMode].length > 0 ? 
                     chatHistory[currentMode][chatHistory[currentMode].length - 1] : null;
  
  // If this is a duplicate of the last message, don't add it again
  if (lastMessage && lastMessage.role === 'user' && lastMessage.content === text) {
    console.log('Duplicate message detected, ignoring');
    return;
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user-message';
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  
  if (saveToHistory) {
    // Initialize mode history if it doesn't exist
    if (!chatHistory[currentMode]) {
      chatHistory[currentMode] = [];
    }
    
    // Add to history
    chatHistory[currentMode].push({
      role: 'user',
      content: text
    });
    
    // Save to localStorage
    saveChatHistory();
  }
  
  scrollToBottom();
}

/**
 * Add an assistant message to the chat
 */
function addAssistantMessage(text, saveToHistory = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant-message';
  
  // Parse markdown in the assistant's response
  messageDiv.innerHTML = markdownParser.parse(text);
  
  // Add message to chat
  chatMessages.appendChild(messageDiv);
  
  if (saveToHistory) {
    // Initialize mode history if it doesn't exist
    if (!chatHistory[currentMode]) {
      chatHistory[currentMode] = [];
    }
    
    // Add to history
    chatHistory[currentMode].push({
      role: 'assistant',
      content: text
    });
    
    // Save to localStorage
    saveChatHistory();
  }
  
  scrollToBottom();
}

/**
 * Scroll to the bottom of the chat container
 */
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Save chat history to localStorage
 */
function saveChatHistory() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
}

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
  const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedHistory) {
    chatHistory = JSON.parse(savedHistory);
  }
}

/**
 * Clear chat history for the current mode
 */
function clearCurrentModeChat() {
  // Clear chat display
  chatMessages.innerHTML = '';
  
  // Clear history for current mode
  chatHistory[currentMode] = [];
  saveChatHistory();
  
  // Add welcome message specific to the current mode
  const welcomeMessage = `Chat cleared. I'm here to help you with ${modes[currentMode].description.toLowerCase().split('.')[0]}. What would you like to know?`;
  addAssistantMessage(welcomeMessage);
}

/**
 * Generate a response using the LLM
 */
function generateResponse(userMessage) {
  // Check if already generating to prevent duplicate responses
  if (isGenerating) {
    console.log('Already generating a response, ignoring duplicate request');
    return;
  }
  
  if (!llmInference) {
    addAssistantMessage('Sorry, the AI model is not loaded yet. Please try again in a moment.');
    return;
  }
  
  // Disable input while generating
  isGenerating = true;
  sendButton.disabled = true;
  userInput.disabled = true;
  
  // Create a placeholder for the assistant's response
  const responsePlaceholder = document.createElement('div');
  responsePlaceholder.className = 'message assistant-message typing';
  
  // Add typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = '<span></span><span></span><span></span>';
  responsePlaceholder.appendChild(typingIndicator);
  
  chatMessages.appendChild(responsePlaceholder);
  scrollToBottom();
  
  // Construct prompt with system prompt, some context from recent history, and the current user message
  let prompt = modes[currentMode].systemPrompt + '\n\n';
  
  // Add up to 2 most recent exchanges for context if available
  if (chatHistory[currentMode] && chatHistory[currentMode].length > 0) {
    const recentHistory = chatHistory[currentMode].slice(-4); // Get up to 4 messages (2 exchanges)
    for (let i = 0; i < recentHistory.length; i++) {
      const msg = recentHistory[i];
      prompt += (msg.role === 'user' ? 'User: ' : 'Assistant: ') + msg.content + '\n';
    }
  }
  
  // Add current user message
  prompt += 'User: ' + userMessage + '\n' + 'Assistant: ';
  
  // Track the generated response
  let generatedResponse = '';
  
  // Generate response with the LLM
  try {
    // Remove any existing typing indicators first to prevent duplicates
    const existingTypingIndicators = document.querySelectorAll('.typing-indicator');
    existingTypingIndicators.forEach(indicator => {
      const parentMessage = indicator.closest('.message');
      if (parentMessage) {
        parentMessage.remove();
      }
    });
    
    // Create a message div that will stay and be updated with streaming content
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message streaming';
    
    // Add typing indicator that will be replaced with content
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messageDiv.appendChild(typingIndicator);
    
    // Add to chat area
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    llmInference.generateResponse(prompt, (partialResponse, complete) => {
      // Append the partial response
      generatedResponse += partialResponse;
      
      // Update the message div with formatted markdown content
      // Remove typing indicator first
      if (typingIndicator.parentNode === messageDiv) {
        messageDiv.removeChild(typingIndicator);
      }
      
      // Apply simple markdown formatting
      messageDiv.innerHTML = markdownParser.parse(generatedResponse);
      scrollToBottom();
      
      // When generation is complete
      if (complete) {
        // Remove streaming class
        messageDiv.classList.remove('streaming');
        
        // Save to history
        if (!chatHistory[currentMode]) {
          chatHistory[currentMode] = [];
        }
        chatHistory[currentMode].push({
          role: 'assistant',
          content: generatedResponse
        });
        saveChatHistory();
        
        // Re-enable input
        isGenerating = false;
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
      }
    });
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Remove any existing typing indicators
    const existingTypingIndicators = document.querySelectorAll('.typing-indicator');
    existingTypingIndicators.forEach(indicator => {
      const parentMessage = indicator.closest('.message');
      if (parentMessage) {
        parentMessage.remove();
      }
    });
    
    // Add error message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    messageDiv.textContent = 'Sorry, there was an error generating a response. Please try again with a shorter message.';
    chatMessages.appendChild(messageDiv);
    
    // Re-enable input
    isGenerating = false;
    sendButton.disabled = false;
    userInput.disabled = false;
  }
}

// Event Listeners

// Send button click
sendButton.addEventListener('click', () => {
  const message = userInput.value.trim();
  if (message && !isGenerating) {
    // Disable the button immediately to prevent double clicks
    sendButton.disabled = true;
    
    // Add user message and generate response
    addUserMessage(message);
    userInput.value = '';
    generateResponse(message);
  }
});

// Enter key press in input
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !sendButton.disabled) {
    e.preventDefault();
    sendButton.click();
  }
});

// Auto-resize input textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = (userInput.scrollHeight) + 'px';
});

// Mode selection
modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.mode !== currentMode) {
      // Store previous mode to check if it changed
      const previousMode = currentMode;
      
      // Update current mode
      currentMode = button.dataset.mode;
      console.log(`Switching from ${previousMode} mode to ${currentMode} mode`);
      
      // Update UI for the new mode
      updateModeUI(currentMode);
      
      // Clear any typing indicators before switching modes
      const existingTypingIndicators = document.querySelectorAll('.typing-indicator');
      existingTypingIndicators.forEach(indicator => {
        const parentMessage = indicator.closest('.message');
        if (parentMessage) {
          parentMessage.remove();
        }
      });
      
      // Display chat history for the new mode
      displayChatHistory();
      
      // If no history for this mode, add a welcome message
      if (!chatHistory[currentMode] || chatHistory[currentMode].length === 0) {
        addAssistantMessage(`Welcome to ${modes[currentMode].title}! I'm here to help you with ${modes[currentMode].description.toLowerCase().split('.')[0]}. What would you like to know?`, true);
      }
    }
  });
});

// Clear chat button
clearChatButton.addEventListener('click', clearCurrentModeChat);

// Initialize the app
initApp();

