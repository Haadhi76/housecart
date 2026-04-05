import { createClient, getAuthenticatedUser } from "@/lib/api/auth";
import { parseRecipeUrlSchema } from "@/lib/validations";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  meat: ["chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "ham", "steak", "ground"],
  seafood: ["fish", "salmon", "tuna", "shrimp", "crab", "lobster", "cod", "tilapia"],
  dairy: ["milk", "cheese", "yogurt", "butter", "cream", "sour cream", "mozzarella", "cheddar", "parmesan"],
  produce: ["lettuce", "tomato", "onion", "garlic", "pepper", "carrot", "celery", "potato", "spinach", "broccoli", "mushroom", "cucumber", "avocado", "lemon", "lime", "ginger", "cilantro", "parsley", "basil", "mint"],
  bakery: ["bread", "tortilla", "roll", "bun", "pita", "croissant"],
  frozen: ["frozen"],
  pantry: ["flour", "sugar", "salt", "oil", "vinegar", "soy sauce", "rice", "pasta", "noodle", "broth", "stock", "can of", "canned", "dried", "baking", "cornstarch", "honey", "maple"],
  beverages: ["juice", "water", "soda", "wine", "beer"],
  snacks: ["chips", "crackers", "nuts", "popcorn"],
};

const UNIT_PATTERN = /^(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|litres?|cloves?|bunch|bunches|cans?|packages?|pieces?|slices?|pinch|pinches|stalks?|heads?|sprigs?)\b/i;

function parseFraction(str: string): number {
  const fractionMap: Record<string, number> = {
    "1/2": 0.5,
    "1/4": 0.25,
    "3/4": 0.75,
    "1/3": 0.333,
    "2/3": 0.667,
    "1/8": 0.125,
    "3/8": 0.375,
    "5/8": 0.625,
    "7/8": 0.875,
  };
  if (fractionMap[str]) return fractionMap[str];

  const parts = str.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (den !== 0) return num / den;
  }
  return parseFloat(str) || 0;
}

function parseQuantity(str: string): number {
  const trimmed = str.trim();
  // Handle mixed fractions like "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1], 10) + parseFraction(mixedMatch[2]);
  }
  // Handle simple fractions
  if (trimmed.includes("/")) {
    return parseFraction(trimmed);
  }
  return parseFloat(trimmed) || 1;
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "other";
}

function parseIngredientString(raw: string): {
  name: string;
  quantity: number;
  unit: string | undefined;
} {
  let str = raw.trim();

  // Match optional quantity at the start
  const quantityPattern = /^([\d\s/½¼¾⅓⅔⅛]+)/;
  let quantity = 1;
  const qMatch = str.match(quantityPattern);
  if (qMatch) {
    let qStr = qMatch[1]
      .replace("½", "1/2")
      .replace("¼", "1/4")
      .replace("¾", "3/4")
      .replace("⅓", "1/3")
      .replace("⅔", "2/3")
      .replace("⅛", "1/8")
      .trim();
    quantity = parseQuantity(qStr);
    str = str.slice(qMatch[0].length).trim();
  }

  // Match optional unit
  let unit: string | undefined;
  const uMatch = str.match(UNIT_PATTERN);
  if (uMatch) {
    unit = uMatch[1].toLowerCase();
    str = str.slice(uMatch[0].length).trim();
  }

  // Remove leading "of " if present
  str = str.replace(/^of\s+/i, "").trim();

  return { name: str || raw, quantity, unit };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    await getAuthenticatedUser(supabase);

    const body: unknown = await request.json();
    const parsed = parseRecipeUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(parsed.data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      html = await res.text();
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch the URL. Check if it is accessible.", code: "FETCH_FAILED" },
        { status: 422 }
      );
    }

    const $ = cheerio.load(html);

    // Look for JSON-LD structured data
    let recipeData: {
      title: string;
      servings: number;
      ingredients: { name: string; quantity: number; unit?: string; category: string }[];
    } | null = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      if (recipeData) return;
      try {
        const json = JSON.parse($(el).html() ?? "");
        const candidates = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];

        for (const item of candidates) {
          if (item["@type"] === "Recipe" || (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
            const title = item.name || "Untitled Recipe";
            let servings = 4;
            if (item.recipeYield) {
              const yieldStr = Array.isArray(item.recipeYield) ? item.recipeYield[0] : item.recipeYield;
              const yieldNum = parseInt(String(yieldStr), 10);
              if (!isNaN(yieldNum) && yieldNum > 0) servings = yieldNum;
            }

            const rawIngredients: string[] = item.recipeIngredient ?? [];
            const ingredients = rawIngredients.map((raw: string) => {
              const { name, quantity, unit } = parseIngredientString(raw);
              return {
                name,
                quantity,
                unit,
                category: categorizeIngredient(name),
              };
            });

            recipeData = { title, servings, ingredients };
            break;
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    });

    if (!recipeData) {
      return NextResponse.json(
        {
          error: "Could not extract recipe. Try adding it manually.",
          code: "PARSE_FAILED",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(recipeData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
