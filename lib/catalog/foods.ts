/**
 * Common food catalog, used for fast autocomplete in the diet plan builder and
 * intake logger, and to prefill rough calories + protein so trainers don't type
 * them every time. Values are per the stated serving and are approximate — the
 * trainer can override any number. Trainers can also log any custom food.
 *
 * Skewed towards foods common in India (the app's launch market) plus staples.
 */

export type FoodGroup =
  | "Grains"
  | "Protein"
  | "Dairy"
  | "Vegetables"
  | "Fruit"
  | "Nuts & fats"
  | "Snacks"
  | "Drinks";

export interface FoodDef {
  name: string;
  group: FoodGroup;
  /** Default serving label, e.g. "1 cup", "100 g", "2 pcs". */
  serving: string;
  calories: number;
  protein: number; // grams
}

export const FOOD_CATALOG: FoodDef[] = [
  // Grains & staples
  { name: "Roti / chapati", group: "Grains", serving: "1 pc", calories: 120, protein: 3 },
  { name: "White rice (cooked)", group: "Grains", serving: "1 cup", calories: 205, protein: 4 },
  { name: "Brown rice (cooked)", group: "Grains", serving: "1 cup", calories: 215, protein: 5 },
  { name: "Idli", group: "Grains", serving: "2 pcs", calories: 120, protein: 4 },
  { name: "Dosa (plain)", group: "Grains", serving: "1 pc", calories: 170, protein: 4 },
  { name: "Poha", group: "Grains", serving: "1 cup", calories: 250, protein: 5 },
  { name: "Upma", group: "Grains", serving: "1 cup", calories: 250, protein: 6 },
  { name: "Oats (cooked)", group: "Grains", serving: "1 cup", calories: 150, protein: 5 },
  { name: "Bread (whole wheat)", group: "Grains", serving: "2 slices", calories: 160, protein: 8 },
  { name: "Quinoa (cooked)", group: "Grains", serving: "1 cup", calories: 220, protein: 8 },

  // Protein
  { name: "Chicken breast (cooked)", group: "Protein", serving: "100 g", calories: 165, protein: 31 },
  { name: "Egg (whole)", group: "Protein", serving: "1 pc", calories: 78, protein: 6 },
  { name: "Egg whites", group: "Protein", serving: "3 pcs", calories: 51, protein: 11 },
  { name: "Fish (cooked)", group: "Protein", serving: "100 g", calories: 180, protein: 25 },
  { name: "Paneer", group: "Protein", serving: "100 g", calories: 265, protein: 18 },
  { name: "Tofu", group: "Protein", serving: "100 g", calories: 145, protein: 15 },
  { name: "Soya chunks (cooked)", group: "Protein", serving: "1 cup", calories: 190, protein: 26 },
  { name: "Dal / lentils (cooked)", group: "Protein", serving: "1 cup", calories: 230, protein: 18 },
  { name: "Rajma (cooked)", group: "Protein", serving: "1 cup", calories: 215, protein: 15 },
  { name: "Chana / chickpeas (cooked)", group: "Protein", serving: "1 cup", calories: 270, protein: 15 },
  { name: "Whey protein", group: "Protein", serving: "1 scoop", calories: 120, protein: 24 },

  // Dairy
  { name: "Milk (toned)", group: "Dairy", serving: "1 cup", calories: 120, protein: 8 },
  { name: "Curd / yogurt", group: "Dairy", serving: "1 cup", calories: 100, protein: 9 },
  { name: "Greek yogurt", group: "Dairy", serving: "1 cup", calories: 130, protein: 17 },
  { name: "Cheese", group: "Dairy", serving: "1 slice", calories: 70, protein: 4 },

  // Vegetables
  { name: "Mixed vegetable sabzi", group: "Vegetables", serving: "1 cup", calories: 120, protein: 4 },
  { name: "Salad (no dressing)", group: "Vegetables", serving: "1 bowl", calories: 50, protein: 2 },
  { name: "Spinach / palak (cooked)", group: "Vegetables", serving: "1 cup", calories: 40, protein: 5 },
  { name: "Broccoli (cooked)", group: "Vegetables", serving: "1 cup", calories: 55, protein: 4 },

  // Fruit
  { name: "Banana", group: "Fruit", serving: "1 pc", calories: 105, protein: 1 },
  { name: "Apple", group: "Fruit", serving: "1 pc", calories: 95, protein: 0 },
  { name: "Orange", group: "Fruit", serving: "1 pc", calories: 62, protein: 1 },
  { name: "Papaya", group: "Fruit", serving: "1 cup", calories: 62, protein: 1 },

  // Nuts & fats
  { name: "Almonds", group: "Nuts & fats", serving: "10 pcs", calories: 70, protein: 3 },
  { name: "Peanuts", group: "Nuts & fats", serving: "30 g", calories: 170, protein: 7 },
  { name: "Peanut butter", group: "Nuts & fats", serving: "1 tbsp", calories: 95, protein: 4 },
  { name: "Ghee / oil", group: "Nuts & fats", serving: "1 tsp", calories: 45, protein: 0 },

  // Snacks
  { name: "Protein bar", group: "Snacks", serving: "1 bar", calories: 200, protein: 20 },
  { name: "Biscuits", group: "Snacks", serving: "3 pcs", calories: 150, protein: 2 },
  { name: "Samosa", group: "Snacks", serving: "1 pc", calories: 260, protein: 4 },

  // Drinks
  { name: "Black coffee", group: "Drinks", serving: "1 cup", calories: 5, protein: 0 },
  { name: "Tea with milk & sugar", group: "Drinks", serving: "1 cup", calories: 90, protein: 2 },
  { name: "Buttermilk / chaas", group: "Drinks", serving: "1 glass", calories: 60, protein: 3 },
];

export const FOOD_NAMES = FOOD_CATALOG.map((f) => f.name);

const BY_NAME = new Map(FOOD_CATALOG.map((f) => [f.name.toLowerCase(), f]));

export function findFood(name: string): FoodDef | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}
