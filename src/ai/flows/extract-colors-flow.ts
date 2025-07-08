'use server';
/**
 * @fileOverview An AI flow to extract dominant and accent colors from an image.
 *
 * - extractColorsFromImage - A function that analyzes an image URL and returns a color palette.
 * - ColorOutput - The return type for the extractColorsFromImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageInputSchema = z.object({
  imageUrl: z.string().url().describe('The public URL of the image to analyze.'),
});

export const ColorOutputSchema = z.object({
    primary: z.string().describe("The most dominant, rich color from the image as a hex code (e.g., '#483D8B'). This will be the main theme color."),
    accent: z.string().describe("A bright, vibrant, and complementary accent color from the image as a hex code (e.g., '#E0FFFF'). This will be used for highlights."),
});
export type ColorOutput = z.infer<typeof ColorOutputSchema>;

export async function extractColorsFromImage(input: { imageUrl: string }): Promise<ColorOutput> {
  // Use a lower-cost model for this task if available, but default to the main one.
  const colorExtractionModel = ai.getModel('googleai/gemini-1.5-flash-latest') || ai;
  
  const prompt = ai.definePrompt({
    name: 'extractColorsPrompt',
    input: { schema: ImageInputSchema },
    output: { schema: ColorOutputSchema },
    prompt: `Analyze the provided image and identify a color palette suitable for a UI theme.

    Return a JSON object with two fields:
    1.  'primary': The most representative and dominant color. It should be rich and suitable for a main theme color.
    2.  'accent': A bright, vibrant color from the image that complements the primary color and can be used for highlights and interactive elements.

    Do not pick black, white, or dull grey colors unless they are the absolute only option. Prioritize vibrant and characteristic colors from the image.

    Image: {{media url=imageUrl}}`,
    config: {
        model: colorExtractionModel
    }
  });
  
  const { output } = await prompt(input);
  if (!output) {
    throw new Error('Failed to extract colors from the image.');
  }
  return output;
}
