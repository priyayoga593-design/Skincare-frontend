export const profile = {
  name: "Aanya Sharma",
  age: 26,
  gender: "Female",
  goals: ["Clear acne", "Even tone", "Hydration"],
  allergies: ["Fragrance"],
  lastScan: "Today, 8:12 AM",
};

export const skinAnalysis = {
  healthScore: 74,
  scoreDelta: +6,
  attributes: [
    { label: "Skin Type", value: "Oily", note: "T-zone dominant" },
    { label: "Skin Tone", value: "Medium", note: "Fitzpatrick IV" },
    { label: "Undertone", value: "Warm", note: "Golden base" },
    { label: "Hydration", value: "Low", note: "Barrier needs support" },
  ],
  concerns: [
    { label: "Acne", level: 62, severity: "Moderate" },
    { label: "Pigmentation", level: 34, severity: "Mild" },
    { label: "Pores", level: 48, severity: "Visible" },
    { label: "Redness", level: 27, severity: "Mild" },
    { label: "Fine lines", level: 12, severity: "Minimal" },
    { label: "Eye bags", level: 41, severity: "Moderate" },
  ],
};

export const progressSeries = [
  { day: "Wk 1", score: 58, hydration: 41, acne: 78 },
  { day: "Wk 2", score: 61, hydration: 47, acne: 72 },
  { day: "Wk 3", score: 64, hydration: 52, acne: 69 },
  { day: "Wk 4", score: 66, hydration: 58, acne: 66 },
  { day: "Wk 5", score: 70, hydration: 63, acne: 64 },
  { day: "Wk 6", score: 74, hydration: 68, acne: 62 },
];

export const habits = {
  water: { current: 1.8, goal: 2.6, unit: "L" },
  sleep: { current: 6.4, goal: 8, unit: "h" },
  steps: { current: 5400, goal: 8000, unit: "" },
  stress: { current: 4, goal: 3, unit: "/10" },
  screen: { current: 7.2, goal: 5, unit: "h" },
  uv: { current: 8, goal: 0, unit: " index" },
  lifestyleScore: 68,
};

export const meals = [
  { slot: "Breakfast", items: "Oats, blueberries, green tea", kcal: 320, skinSafe: true },
  { slot: "Lunch", items: "Grilled paneer bowl, salad", kcal: 540, skinSafe: true },
  { slot: "Snack", items: "Iced latte + croissant", kcal: 410, skinSafe: false },
  { slot: "Dinner", items: "Dal, roti, sautéed greens", kcal: 480, skinSafe: true },
];

export const foodGuidance = {
  eat: ["Omega-3 rich fish", "Zinc: pumpkin seeds", "Vitamin C fruits", "Probiotic curd"],
  avoid: ["High-GI sugar", "Dairy-heavy coffee", "Deep-fried snacks", "Excess sodium"],
};

export const routines = {
  morning: [
    { step: "Cleanse", product: "Salicylic Gentle Face Wash", wait: "—", note: "Lukewarm water" },
    { step: "Treat", product: "10% Niacinamide Serum", wait: "60s", note: "3 drops" },
    { step: "Hydrate", product: "Oil-Free Gel Moisturiser", wait: "—", note: "Pea size" },
    { step: "Protect", product: "SPF 50 Matte Fluid", wait: "—", note: "2 finger rule" },
  ],
  night: [
    { step: "Double cleanse", product: "Micellar + Face Wash", wait: "—", note: "Remove SPF" },
    { step: "Exfoliate", product: "2% BHA (Tue/Fri)", wait: "5 min", note: "Avoid eyes" },
    { step: "Repair", product: "Ceramide Barrier Cream", wait: "—", note: "Seal moisture" },
  ],
  weekly: [
    { step: "Clay mask", product: "Kaolin Purifying Mask", wait: "10 min", note: "Sunday" },
    { step: "Hydrating sheet mask", product: "HA Sheet Mask", wait: "15 min", note: "Wednesday" },
  ],
};

export type Store = { store: string; price: number; offer: string; best?: boolean };

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: "Skincare" | "Makeup";
  subcategory: string;
  price: number;
  rating: number;
  reviews: number;
  match: number;
  reason: string;
  ingredients: string[];
  benefits: string[];
  suitable: string;
  usage: string;
  stores: Store[];
};

export const products: Product[] = [
  {
    id: "cleanser",
    name: "Salicylic Gentle Face Wash",
    brand: "Dermaline",
    category: "Skincare",
    subcategory: "Face Wash",
    price: 549,
    rating: 4.5,
    reviews: 2841,
    match: 96,
    reason:
      "Oily skin + moderate acne: 2% salicylic acid clears pore congestion without stripping.",
    ingredients: ["Salicylic Acid 2%", "Glycerin", "Zinc PCA"],
    benefits: ["Unclogs pores", "Controls oil", "Fragrance-free"],
    suitable: "Oily · Acne-prone · Fragrance allergy safe",
    usage: "Twice daily · 1 pump · 30s massage",
    stores: [
      { store: "Official Brand", price: 549, offer: "10% OFF" },
      { store: "Nykaa", price: 499, offer: "Flat ₹50 OFF" },
      { store: "Amazon", price: 479, offer: "15% OFF + cashback", best: true },
      { store: "Flipkart", price: 489, offer: "Free delivery" },
    ],
  },
  {
    id: "serum",
    name: "10% Niacinamide Clarity Serum",
    brand: "Solvea",
    category: "Skincare",
    subcategory: "Serum",
    price: 699,
    rating: 4.6,
    reviews: 5120,
    match: 93,
    reason: "Targets your mild pigmentation and visible pores while regulating sebum.",
    ingredients: ["Niacinamide 10%", "Zinc 1%", "Panthenol"],
    benefits: ["Fades marks", "Refines pores", "Calms redness"],
    suitable: "Oily · Medium tone · Pigmentation",
    usage: "Morning · 3 drops · wait 60s before moisturiser",
    stores: [
      { store: "Official Brand", price: 699, offer: "Buy 1 Get 1 mini" },
      { store: "Nykaa", price: 649, offer: "12% OFF", best: true },
      { store: "Amazon", price: 669, offer: "Coupon ₹30" },
      { store: "Flipkart", price: 679, offer: "Free delivery" },
    ],
  },
  {
    id: "spf",
    name: "SPF 50 PA++++ Matte Fluid",
    brand: "Aurea",
    category: "Skincare",
    subcategory: "Sunscreen",
    price: 899,
    rating: 4.7,
    reviews: 3390,
    match: 98,
    reason: "UV index is 8 today and you have active pigmentation — non-greasy high protection.",
    ingredients: ["Tinosorb S", "Uvinul A Plus", "Silica"],
    benefits: ["No white cast", "Matte finish", "Sweat resistant"],
    suitable: "Oily · All tones",
    usage: "Morning · 2 finger lengths · reapply every 3h",
    stores: [
      { store: "Official Brand", price: 899, offer: "Free travel size", best: true },
      { store: "Nykaa", price: 909, offer: "5% OFF" },
      { store: "Amazon", price: 939, offer: "—" },
      { store: "Flipkart", price: 929, offer: "Free delivery" },
    ],
  },
  {
    id: "foundation",
    name: "Skin Blur Foundation — 320 Warm Sand",
    brand: "Muse Studio",
    category: "Makeup",
    subcategory: "Foundation",
    price: 1250,
    rating: 4.4,
    reviews: 1870,
    match: 94,
    reason:
      "Shade matched to Medium depth with warm undertone; oil-control formula for your skin type.",
    ingredients: ["Silica", "Niacinamide", "Vitamin E"],
    benefits: ["12h wear", "Blurs pores", "Transfer resistant"],
    suitable: "Medium · Warm undertone · Oily",
    usage: "2 pumps · buff outward with damp sponge",
    stores: [
      { store: "Official Brand", price: 1250, offer: "10% OFF" },
      { store: "Nykaa", price: 1125, offer: "Flat ₹125 OFF", best: true },
      { store: "Amazon", price: 1199, offer: "Coupon ₹50" },
      { store: "Flipkart", price: 1180, offer: "Free delivery" },
    ],
  },
  {
    id: "blush",
    name: "Cream Blush — Terracotta Warmth",
    brand: "Muse Studio",
    category: "Makeup",
    subcategory: "Blush",
    price: 640,
    rating: 4.3,
    reviews: 940,
    match: 89,
    reason: "Warm terracotta flatters golden undertones on medium depth skin.",
    ingredients: ["Squalane", "Jojoba Ester", "Mica"],
    benefits: ["Natural flush", "Blendable", "Buildable"],
    suitable: "Medium · Warm undertone",
    usage: "Tap 2 dots on cheekbones · blend with fingers",
    stores: [
      { store: "Official Brand", price: 640, offer: "—" },
      { store: "Nykaa", price: 595, offer: "7% OFF", best: true },
      { store: "Amazon", price: 610, offer: "—" },
      { store: "Flipkart", price: 620, offer: "Free delivery" },
    ],
  },
  {
    id: "lipstick",
    name: "Satin Lip Colour — Spiced Rose",
    brand: "Lueur",
    category: "Makeup",
    subcategory: "Lipstick",
    price: 780,
    rating: 4.5,
    reviews: 1420,
    match: 91,
    reason: "Warm rose with brown depth reads harmonious against your undertone.",
    ingredients: ["Shea Butter", "Castor Oil", "Vitamin E"],
    benefits: ["Non-drying", "6h wear", "Satin finish"],
    suitable: "Warm undertone · All types",
    usage: "Apply from centre outward · blot once",
    stores: [
      { store: "Official Brand", price: 780, offer: "10% OFF" },
      { store: "Nykaa", price: 702, offer: "Flat ₹78 OFF", best: true },
      { store: "Amazon", price: 749, offer: "—" },
      { store: "Flipkart", price: 760, offer: "Free delivery" },
    ],
  },
];

export const tutorials = [
  {
    title: "Morning skin routine",
    duration: "4 min",
    kind: "Skincare",
    steps: [
      "Wash face with Salicylic Gentle Face Wash — 30 seconds, lukewarm water.",
      "Press 3 drops of Niacinamide Serum into damp skin, wait 60 seconds.",
      "Apply pea-size Oil-Free Gel Moisturiser upward and outward.",
      "Finish with 2 finger lengths of SPF 50 Matte Fluid, including ears and neck.",
    ],
  },
  {
    title: "Everyday warm-tone makeup",
    duration: "7 min",
    kind: "Makeup",
    steps: [
      "Primer: pea size on T-zone only to grip foundation.",
      "Foundation 320 Warm Sand: 2 pumps, buff with damp sponge.",
      "Concealer: 3 dots under eyes in triangle, tap to blend.",
      "Cream blush Terracotta Warmth on cheekbones, blend upward.",
      "Neutral bronze eyeshadow through crease, mascara on upper lashes.",
      "Spiced Rose lipstick, then setting spray in an X and T motion.",
    ],
  },
  {
    title: "Night barrier repair",
    duration: "5 min",
    kind: "Skincare",
    steps: [
      "Double cleanse: micellar first, then face wash.",
      "BHA exfoliant on Tuesday and Friday only — wait 5 minutes.",
      "Seal with Ceramide Barrier Cream on slightly damp skin.",
    ],
  },
];

export const safetyTips = [
  "Patch test new actives behind the ear for 24 hours.",
  "You flagged a fragrance allergy — all picks are fragrance-free.",
  "Never layer BHA with retinol on the same night.",
  "Vitamin C in the morning, exfoliants at night.",
  "Reapply sunscreen every 3 hours outdoors; UV index today is 8.",
];

export const reminders = [
  { label: "Drink 300ml water", time: "In 25 min", tone: "sage" as const },
  { label: "Evening face scan", time: "9:00 PM", tone: "clay" as const },
  { label: "Night routine", time: "10:15 PM", tone: "sage" as const },
  { label: "Face wash refill in 6 days", time: "Reorder", tone: "clay" as const },
];

export const assistantQuestions = [
  {
    q: "Why am I getting acne on my chin?",
    a: "Your last 3 scans show congestion concentrated on the chin, alongside a 6.4h average sleep and 2 high-sugar snack entries this week. Hormonal chin acne is amplified by both. Keep the 2% BHA twice weekly and swap the iced latte snack for a lower-GI option for 14 days — we will re-measure on your weekly scan.",
  },
  {
    q: "Which foundation shade matches me?",
    a: "Medium depth with a warm golden undertone maps to shade 320 Warm Sand in Muse Studio Skin Blur. If you tan by mid-summer, 340 Amber Sand becomes the better match.",
  },
  {
    q: "Can I use Vitamin C?",
    a: "Yes, but not with your BHA nights. Use a 10–15% ascorbic derivative in the morning before sunscreen. Since your hydration reads low, pick a formula with glycerin and skip alcohol-heavy essences.",
  },
];
