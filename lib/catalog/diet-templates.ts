import { findFood } from "@/lib/catalog/foods";
import type { DietPlanDay, DietPlanMeal, DietPlanFoodItem, MealType } from "@/lib/types";

/**
 * Starter diet plans — seed a plan instantly with no AI call. Food names are
 * drawn from the catalog so quantities, calories and protein prefill
 * automatically; the trainer tweaks portions and targets after seeding.
 */
export interface DietTemplate {
  key: string;
  label: string;
  description: string;
  target_calories: number;
  target_protein_g: number;
  days: DietPlanDay[];
}

/** Catalog-backed item: pulls serving/calories/protein from the food catalog. */
function food(name: string, qty?: string): DietPlanFoodItem {
  const match = findFood(name);
  return {
    food: name,
    qty: qty ?? match?.serving ?? "",
    calories: match ? String(match.calories) : "",
    protein: match ? String(match.protein) : "",
    notes: "",
  };
}

function meal(m: MealType, time: string, items: DietPlanFoodItem[]): DietPlanMeal {
  return { meal: m, time, items };
}

export const DIET_TEMPLATES: DietTemplate[] = [
  {
    key: "fat-loss",
    label: "Fat loss · ~1600 kcal",
    description: "Higher protein, lighter carbs — a steady deficit day.",
    target_calories: 1600,
    target_protein_g: 130,
    days: [
      {
        day: "Every day",
        title: "Deficit day",
        meals: [
          meal("breakfast", "08:00", [food("Egg whites"), food("Oats (cooked)"), food("Black coffee")]),
          meal("lunch", "13:00", [
            food("Chicken breast (cooked)"),
            food("Brown rice (cooked)", "½ cup"),
            food("Salad (no dressing)"),
          ]),
          meal("snack", "17:00", [food("Greek yogurt"), food("Apple")]),
          meal("dinner", "20:30", [food("Fish (cooked)"), food("Mixed vegetable sabzi"), food("Roti / chapati")]),
        ],
      },
    ],
  },
  {
    key: "muscle-gain",
    label: "Muscle gain · ~2600 kcal",
    description: "High protein surplus for size and strength work.",
    target_calories: 2600,
    target_protein_g: 180,
    days: [
      {
        day: "Every day",
        title: "Surplus day",
        meals: [
          meal("breakfast", "08:00", [
            food("Egg (whole)", "3 pcs"),
            food("Oats (cooked)"),
            food("Banana"),
            food("Peanut butter"),
          ]),
          meal("lunch", "13:00", [
            food("Chicken breast (cooked)", "150 g"),
            food("White rice (cooked)"),
            food("Dal / lentils (cooked)"),
          ]),
          meal("snack", "17:00", [food("Whey protein"), food("Milk (toned)"), food("Almonds")]),
          meal("dinner", "20:30", [
            food("Paneer"),
            food("Roti / chapati", "3 pcs"),
            food("Mixed vegetable sabzi"),
          ]),
        ],
      },
    ],
  },
  {
    key: "balanced",
    label: "Balanced · ~2000 kcal",
    description: "Maintenance day with even protein across meals.",
    target_calories: 2000,
    target_protein_g: 120,
    days: [
      {
        day: "Every day",
        title: "Maintenance day",
        meals: [
          meal("breakfast", "08:00", [food("Idli"), food("Curd / yogurt"), food("Tea with milk & sugar")]),
          meal("lunch", "13:00", [
            food("Chicken breast (cooked)"),
            food("White rice (cooked)"),
            food("Mixed vegetable sabzi"),
          ]),
          meal("snack", "17:00", [food("Whey protein"), food("Banana")]),
          meal("dinner", "20:30", [food("Dal / lentils (cooked)"), food("Roti / chapati", "2 pcs"), food("Salad (no dressing)")]),
        ],
      },
    ],
  },
];
