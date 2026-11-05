/**
 * The "Generate with AI" diet-plan brief — the structured intake a coach fills
 * (or confirms) before the model drafts a meal plan. Shared by the client UI
 * (components/nutrition/ai-diet-brief.tsx) and the server action
 * (app/(dashboard)/clients/[id]/nutrition/plan-ai-actions.ts) so the option
 * lists and the shape never drift apart.
 *
 * It captures what a real diet coach asks before writing a plan: the goal and
 * target, calorie/protein/macro intent, how the client eats (pattern, cuisine,
 * meals per day), the non-negotiables (allergies, medical conditions), and the
 * practical limits (activity, cooking time, budget). Nothing here is persisted
 * to the client record — it lives for the length of one generation, and is
 * reused when the coach regenerates with tweaks.
 */

export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "athlete";

export interface DietBrief {
  /** Free-text goal in the coach's own words. */
  goal: string;
  /** Quick goal tags (chips) — see GOAL_FOCUS_OPTIONS. */
  goalFocus: string[];
  /** Target body weight in kg, or "" for none. */
  targetWeightKg: string;
  /** Target date / event, yyyy-mm-dd, or "" for none. */
  deadline: string;
  /** Daily calorie target; "" lets the model estimate from the client picture. */
  calories: string;
  /** Daily protein target in grams; "" lets the model decide. */
  protein: string;
  /** How to split the macros — see MACRO_APPROACH_OPTIONS ("auto" = model decides). */
  macroApproach: string;
  mealsPerDay: number;
  /** What the client eats — see DIETARY_PATTERN_OPTIONS. */
  dietaryPattern: string;
  /** Preferred cuisines (chips) — see CUISINE_OPTIONS. */
  cuisines: string[];
  /** Allergies / intolerances to strictly exclude — see ALLERGY_OPTIONS (+ free text in notes). */
  allergies: string[];
  /** Medical conditions the plan must respect — see CONDITION_OPTIONS. */
  conditions: string[];
  /** Foods the client enjoys (free text). */
  likes: string;
  /** Foods the client dislikes or won't eat (free text). */
  dislikes: string;
  /** Daily activity level, used to estimate energy needs. */
  activity: ActivityLevel;
  /** How much the client will cook — see COOKING_TIME_OPTIONS. */
  cookingTime: string;
  /** Grocery budget — see BUDGET_OPTIONS. */
  budget: string;
  /** How many days the plan spans — see DAY_STRUCTURE_OPTIONS. */
  dayStructure: string;
  /** Suggest supplements where genuinely useful. */
  includeSupplements: boolean;
  /** Add a daily water / hydration target to the plan notes. */
  includeHydration: boolean;
  /** Favour batch-cook / meal-prep-friendly meals. */
  mealPrep: boolean;
  /** Anything else the coach wants to tell the model (free text). */
  notes: string;
}

export const GOAL_FOCUS_OPTIONS = [
  "Fat loss",
  "Build muscle",
  "Body recomposition",
  "Maintain weight",
  "More energy",
  "Gut / digestion",
  "Sports performance",
] as const;

export const MACRO_APPROACH_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Let AI decide" },
  { value: "balanced", label: "Balanced" },
  { value: "high_protein", label: "High protein" },
  { value: "low_carb", label: "Low carb" },
  { value: "keto", label: "Keto" },
  { value: "high_carb", label: "High carb" },
  { value: "mediterranean", label: "Mediterranean" },
];

export const MEALS_PER_DAY_OPTIONS = [3, 4, 5, 6] as const;

export const DIETARY_PATTERN_OPTIONS: { value: string; label: string }[] = [
  { value: "no_restriction", label: "No restriction" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non_vegetarian", label: "Non-vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain (no root veg)" },
];

export const CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "Continental",
  "Chinese / Asian",
  "Mediterranean",
  "No preference",
] as const;

export const ALLERGY_OPTIONS = [
  "Dairy / lactose",
  "Gluten",
  "Nuts",
  "Peanuts",
  "Soy",
  "Eggs",
  "Shellfish",
] as const;

export const CONDITION_OPTIONS = [
  "Diabetes",
  "High blood pressure",
  "Thyroid",
  "PCOS / PCOD",
  "High cholesterol",
  "IBS / digestive",
  "Fatty liver",
  "Pregnant / postpartum",
] as const;

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "very", label: "Very active" },
  { value: "athlete", label: "Athlete" },
];

export const COOKING_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: "minimal", label: "Minimal cooking" },
  { value: "moderate", label: "Some cooking" },
  { value: "enjoys", label: "Happy to cook" },
];

export const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: "low", label: "Budget-friendly" },
  { value: "moderate", label: "Moderate" },
  { value: "flexible", label: "No limit" },
];

export const DAY_STRUCTURE_OPTIONS: { value: string; label: string }[] = [
  { value: "one", label: "One representative day" },
  { value: "train_rest", label: "Training day + rest day" },
  { value: "week", label: "Full 7-day week" },
];

/** How many diet days each structure asks the model to produce. */
export function dayCountFor(structure: string): number {
  if (structure === "week") return 7;
  if (structure === "train_rest") return 2;
  return 1;
}

export function defaultDietBrief(): DietBrief {
  return {
    goal: "",
    goalFocus: [],
    targetWeightKg: "",
    deadline: "",
    calories: "",
    protein: "",
    macroApproach: "auto",
    mealsPerDay: 4,
    dietaryPattern: "no_restriction",
    cuisines: [],
    allergies: [],
    conditions: [],
    likes: "",
    dislikes: "",
    activity: "moderate",
    cookingTime: "moderate",
    budget: "moderate",
    dayStructure: "one",
    includeSupplements: false,
    includeHydration: true,
    mealPrep: false,
    notes: "",
  };
}
