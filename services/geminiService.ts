import type { Question, Difficulty, QuestionCategory } from '../types';

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateQuestion = async (
    difficulty: Difficulty, 
    category: QuestionCategory | 'All' = 'All',
    language: 'en' | 'es' = 'es'
): Promise<Question> => {
    try {
        const response = await fetch('/api/gemini/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty, category, language })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as Question;
    } catch (error) {
        console.error("Error in client generateQuestion:", error);
        throw new Error("Failed to generate question.");
    }
};

export const getPersonalizedFeedback = async (
    question: Question, 
    userAnswer: any, 
    isCorrect: boolean,
    language: 'en' | 'es' = 'es',
    length: 'short' | 'detailed' = 'detailed'
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/personalized-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, userAnswer, isCorrect, language, length })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error in client getPersonalizedFeedback:", error);
        const correctPrefix = language === 'es' ? 'Respuesta(s) Correcta(s):' : 'Correct Answer(s):';
        return `**${correctPrefix} ${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}**\n\n${question.explanation}`;
    }
};

export const generateSpeech = async (text: string, voiceName: string = 'Puck', audioContext: AudioContext): Promise<AudioBuffer> => {
    try {
        const response = await fetch('/api/gemini/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voiceName })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const base64Audio = data.base64Audio;
        if (!base64Audio) {
            throw new Error("No speech audio returned from server.");
        }
        return await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
    } catch (error) {
        console.error("Error in client generateSpeech:", error);
        throw error;
    }
};

export const generatePracticeExamStream = async (
    onChunk: (chunk: string) => void, 
    questionCount: number = 25,
    language: 'en' | 'es' = 'es'
): Promise<void> => {
    try {
        const response = await fetch('/api/gemini/practice-exam-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionCount, language })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
            throw new Error("No response body for streaming practice exam");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            onChunk(chunk);
        }
    } catch (error) {
        console.error("Error in client generatePracticeExamStream:", error);
        throw error;
    }
};

export const generateStudyGuideStream = async (
    category: any, 
    length: any, 
    onChunk: any,
    language: 'en' | 'es' = 'es'
) => {
    try {
        const response = await fetch('/api/gemini/study-guide-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, length, language })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
            throw new Error("No response body for streaming study guide");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            onChunk(chunk);
        }
    } catch (error) {
        console.error("Error in client generateStudyGuideStream:", error);
        throw error;
    }
};

export const generateRelatedTips = async (question: any) => { return []; };
