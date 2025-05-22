'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered car wash service suggestions.
 *
 * - suggestServices - A function that takes car details and customer preferences as input and returns service suggestions.
 * - SuggestServicesInput - The input type for the suggestServices function.
 * - SuggestServicesOutput - The output type for the suggestServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestServicesInputSchema = z.object({
  carDetails: z
    .string()
    .describe('Details about the car, including make, model, year, and condition.'),
  customerPreferences: z
    .string()
    .describe('Customer preferences for car wash services.'),
});
export type SuggestServicesInput = z.infer<typeof SuggestServicesInputSchema>;

const SuggestServicesOutputSchema = z.object({
  suggestedServices: z
    .array(z.string())
    .describe('An array of suggested car wash services.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the service suggestions.'),
});
export type SuggestServicesOutput = z.infer<typeof SuggestServicesOutputSchema>;

export async function suggestServices(
  input: SuggestServicesInput
): Promise<SuggestServicesOutput> {
  return suggestServicesFlow(input);
}

const suggestServicesPrompt = ai.definePrompt({
  name: 'suggestServicesPrompt',
  input: {schema: SuggestServicesInputSchema},
  output: {schema: SuggestServicesOutputSchema},
  prompt: `You are an expert car wash service advisor. Based on the car details and customer preferences, suggest a list of car wash services and explain your reasoning.\n\nCar Details: {{{carDetails}}}\nCustomer Preferences: {{{customerPreferences}}}\n\nSuggested Services:`,
});

const suggestServicesFlow = ai.defineFlow(
  {
    name: 'suggestServicesFlow',
    inputSchema: SuggestServicesInputSchema,
    outputSchema: SuggestServicesOutputSchema,
  },
  async input => {
    const {output} = await suggestServicesPrompt(input);
    return output!;
  }
);
