'use server';
/**
 * @fileOverview An AI flow to extract a color theme from an image.
 *
 * - extractThemeColors - A function that extracts a primary and accent color from an image URL.
 * - ColorThemeInput - The input type for the extractThemeColors function.
 * - ColorThemeOutput - The return type for the extractThemeColors function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ColorThemeInputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the image to analyze.'),
});
export type ColorThemeInput = z.infer<typeof ColorThemeInputSchema>;

const ColorThemeOutputSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid HEX color code").describe('The dominant color as a HEX code (e.g., #RRGGBB).'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid HEX color code").describe('A vibrant, contrasting accent color from the image, as a HEX code (e.g., #RRGGBB).'),
});
export type ColorThemeOutput = z.infer<typeof ColorThemeOutputSchema>;

export async function extractThemeColors(input: ColorThemeInput): Promise<ColorThemeOutput> {
  return extractThemeColorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractThemeColorsPrompt',
  input: { schema: ColorThemeInputSchema },
  output: { schema: ColorThemeOutputSchema },
  prompt: `You are a color theme expert for a user interface. Analyze the provided image and extract two colors.

1.  **Primary Color**: This should be a dominant, representative color from the image. It will be used for main UI elements. Avoid pure white, black, or very dark gray unless it is overwhelmingly the main color.
2.  **Accent Color**: This should be a secondary, but vibrant and energetic color from the image that contrasts well with the primary color. It will be used for buttons and highlights.

Return the colors as HEX codes in a valid JSON object.

Image to analyze:
{{media url=imageUrl}}
`,
});

const extractThemeColorsFlow = ai.defineFlow(
  {
    name: 'extractThemeColorsFlow',
    inputSchema: ColorThemeInputSchema,
    outputSchema: ColorThemeOutputSchema,
  },
  async (input) => {
    try {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('AI did not return a color theme.');
        }
        return output;
    } catch (e) {
        console.error("Error in extractThemeColorsFlow:", e);
        // Fallback to avoid crashing the app
        return {
            primaryColor: '#483D8B', // Default primary from PRD
            accentColor: '#E0FFFF', // Default accent from PRD
        };
    }
  }
);
