import { NextRequest, NextResponse } from "next/server";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

import { auth } from "@/lib/auth";
import { config } from "@/config";

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const token = config.openai.apiKey;
    if (!token) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN is not set" },
        { status: 500 }
      );
    }

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates recipes based on user prompts.
            Users will provide a prompt, and you should return a detailed recipe in JSON format.
            The recipe must include the following fields: name, description, instructions, cookingTime (in minutes), servings, and a list of ingredients.
            Each ingredient must have a name, quantity, and unit.
            The unit for each ingredient must be one of the following values: "pcs", "g", "kg", "L", "ml", "pack", "box".
            For example, if the user asks for "a simple chicken pasta recipe", you should return a complete recipe that includes a name like "Easy Chicken and Penne Pasta", a brief description, step-by-step instructions, the estimated cooking time, the number of servings, and a detailed list of ingredients with their respective quantities and units.
            Please ensure the JSON output is clean and directly usable, with no extra text or explanations.
            The cookingTime should be a number, and servings should also be a number.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: model,
      },
    });

    if (isUnexpected(response)) {
      console.error(
        "Error generating recipe:",
        JSON.stringify(response.body, null, 2)
      );
      return NextResponse.json(
        { error: "Failed to generate recipe" },
        { status: 500 }
      );
    }

    const recipeJson = response.body.choices[0].message.content;

    if (!recipeJson) {
      return NextResponse.json(
        { error: "Failed to generate recipe" },
        { status: 500 }
      );
    }
    const parsedRecipe = JSON.parse(recipeJson);
    return NextResponse.json(parsedRecipe);
  } catch (error) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
