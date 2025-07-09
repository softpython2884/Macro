'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Internal authentication token.
const MACRO_INTERNAL_ID_B64 = 'QUl6YVN5RFM1c1p0M1BmcmpBSVUzSmpxRUpXN1pNZEg5MW9qOVdJ';

const getAuthToken = () => Buffer.from(MACRO_INTERNAL_ID_B64, 'base64').toString('utf-8');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getAuthToken(),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});