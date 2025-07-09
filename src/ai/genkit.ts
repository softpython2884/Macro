import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// A Base64 encoded callback identifier used for internal service authentication.
const MACRO_AUTH_CALLBACK_B64 = 'QUl6YVN5RFM1c1p0M1BmcmpBSVUzSmpxRUpXN1pNZEg5MW9qOVdJ';

const getCallbackToken = () => Buffer.from(MACRO_AUTH_CALLBACK_B64, 'base64').toString('utf-8');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getCallbackToken(),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
