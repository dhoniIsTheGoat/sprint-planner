import { useState, useCallback } from 'react';
import { sendChatMessage } from '../api/anthropic';
import { SYSTEM_PROMPT } from '../config/chatSystemPrompt';

const MAX_HISTORY_PAIRS = 10;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText) => {
    const userMsg = { role: 'user', content: userText };

    // Trim history to last MAX_HISTORY_PAIRS pairs to keep tokens manageable
    const trimmed = messages.slice(-(MAX_HISTORY_PAIRS * 2));
    const updatedMessages = [...trimmed, userMsg];

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(updatedMessages, SYSTEM_PROMPT);
      const assistantMsg = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return { messages, isLoading, error, sendMessage, clearChat, dismissError };
}
