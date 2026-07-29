// src/lib/nutrition-utils.ts

export const SKIN_UNFRIENDLY_CATEGORIES = [
  "fried",
  "oily",
  "fast food",
  "processed",
  "sugar",
  "soft drink",
  "chocolate",
  "dairy",
  "high gi",
  "packaged",
  "bakery",
];

const UNFRIENDLY_KEYWORDS = [
  "fries", "french fries", "fried chicken", "deep fried", "fried",
  "burger", "pizza", "hot dog", "hotdog", "sausage", "nuggets",
  "chips", "crisps", "doritos", "cheetos",
  "donut", "candy", "sweet", "sweets", "sugar",
  "cola", "soda", "pepsi", "sprite", "fanta", "soft drink", "energy drink",
  "chocolate", "chocolates",
  "milk", "cheese", "butter", "ice cream", "cream",
  "white bread", "white rice", "pasta",
  "cake", "pastry", "cookies", "biscuit", "muffin", "brownie"
];

const HEALTHY_ALTERNATIVES: Record<string, string> = {
  "fries": "Baked Sweet Potato",
  "french fries": "Baked Sweet Potato",
  "burger": "Grilled Chicken Sandwich",
  "pizza": "Whole Wheat Veg Pizza",
  "soft drink": "Lemon Water",
  "cola": "Lemon Water",
  "soda": "Lemon Water",
  "pepsi": "Lemon Water",
  "ice cream": "Greek Yogurt with Fruits",
  "chocolate": "Mixed Nuts",
  "chips": "Roasted Chickpeas or Popcorn",
  "white bread": "Whole Grain or Sourdough Bread",
  "cake": "Fresh Fruit Salad",
  "cookies": "Oatmeal and Banana Cookies",
  "candy": "Fresh Berries"
};

const FRIENDLY_REMINDERS = [
  "💛 This food may not be ideal for healthy skin if eaten frequently.",
  "✨ Foods high in oil or sugar can sometimes contribute to acne or dull skin. Try eating them in moderation.",
  "🌿 Consider balancing this meal with vegetables, fruits, or plenty of water.",
  "🥗 A skin-friendly diet can help maintain healthier skin over time."
];

export function analyzeFood(foodName: string): {
  isSkinUnfriendly: boolean;
  reminder?: string;
  suggestion?: string;
} {
  const lowerFood = foodName.toLowerCase();
  
  // Check if food matches any unfriendly keyword
  const isUnfriendly = UNFRIENDLY_KEYWORDS.some(keyword => lowerFood.includes(keyword));
  
  if (!isUnfriendly) {
    return { isSkinUnfriendly: false };
  }

  // Find a specific alternative if available
  let suggestion = undefined;
  for (const [key, alternative] of Object.entries(HEALTHY_ALTERNATIVES)) {
    if (lowerFood.includes(key)) {
      suggestion = alternative;
      break;
    }
  }

  // Pick a random friendly reminder
  const randomReminder = FRIENDLY_REMINDERS[Math.floor(Math.random() * FRIENDLY_REMINDERS.length)];

  return {
    isSkinUnfriendly: true,
    reminder: randomReminder,
    suggestion
  };
}
