'use server';
/**
 * @fileOverview An AI flow to recommend games.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecommendGamesInputSchema = z.object({
  playedGames: z.array(z.string()).describe('A list of games the user has played.'),
});
export type RecommendGamesInput = z.infer<typeof RecommendGamesInputSchema>;

const RecommendGamesOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of 5 new game names to recommend.'),
});
export type RecommendGamesOutput = z.infer<typeof RecommendGamesOutputSchema>;

export async function recommendGames(input: RecommendGamesInput): Promise<RecommendGamesOutput> {
  return recommendGamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendGamesPrompt',
  input: { schema: RecommendGamesInputSchema },
  output: { schema: RecommendGamesOutputSchema },
  prompt: `You are an expert in video game recommendations. Based on the following list of games the user enjoys, please suggest 5 other similar games they might like to play.

Focus on suggesting popular and well-regarded titles that fit the genres and themes of the user's played games.

Only return the names of the suggested games. Do not add any extra text or formatting. The output must be a valid JSON object matching the requested schema.

Games played:
{{#each playedGames}}
- {{this}}
{{/each}}
`,
});

const recommendGamesFlow = ai.defineFlow(
  {
    name: 'recommendGamesFlow',
    inputSchema: RecommendGamesInputSchema,
    outputSchema: RecommendGamesOutputSchema,
  },
  async (input) => {
    // If user has no games, return empty recommendations
    if (input.playedGames.length === 0) {
      return { recommendations: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
