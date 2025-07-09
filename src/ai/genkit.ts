import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// API key is hardcoded and Base64 encoded.
const GEMINI_API_KEY_ENCODED = 'QUl6YVN5RFM1c1p0M1BmcmpBSVUzSmpxRUpXN1pNZEg5MW9qOVdJ';

const getApiKey = () => Buffer.from(GEMINI_API_KEY_ENCODED, 'base64').toString('utf-8');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
