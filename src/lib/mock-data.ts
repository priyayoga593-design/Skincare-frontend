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

export type Store = { store: string; price: number; offer: string; best?: boolean; url: string };

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
  image: string;
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
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop",
    reason:
      "Oily skin + moderate acne: 2% salicylic acid clears pore congestion without stripping.",
    ingredients: ["Salicylic Acid 2%", "Glycerin", "Zinc PCA"],
    benefits: ["Unclogs pores", "Controls oil", "Fragrance-free"],
    suitable: "Oily · Acne-prone · Fragrance allergy safe",
    usage: "Twice daily · 1 pump · 30s massage",
    stores: [
      { store: "Official Brand", price: 549, offer: "10% OFF", url: "https://example.com/brand/salicylic-wash" },
      { store: "Nykaa", price: 499, offer: "Flat ₹50 OFF", url: "https://nykaa.com/salicylic-wash" },
      { store: "Amazon", price: 479, offer: "15% OFF + cashback", best: true, url: "https://amazon.in/dp/B000SALIC" },
      { store: "Flipkart", price: 489, offer: "Free delivery", url: "https://flipkart.com/salicylic-wash" },
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
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
    reason: "Targets your mild pigmentation and visible pores while regulating sebum.",
    ingredients: ["Niacinamide 10%", "Zinc 1%", "Panthenol"],
    benefits: ["Fades marks", "Refines pores", "Calms redness"],
    suitable: "Oily · Medium tone · Pigmentation",
    usage: "Morning · 3 drops · wait 60s before moisturiser",
    stores: [
      { store: "Official Brand", price: 699, offer: "Buy 1 Get 1 mini", url: "https://example.com/brand/niacinamide-serum" },
      { store: "Nykaa", price: 649, offer: "12% OFF", best: true, url: "https://nykaa.com/niacinamide-serum" },
      { store: "Amazon", price: 669, offer: "Coupon ₹30", url: "https://amazon.in/dp/B000NIAC" },
      { store: "Flipkart", price: 679, offer: "Free delivery", url: "https://flipkart.com/niacinamide-serum" },
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
    image: "https://images.unsplash.com/photo-1579566318995-19e4917aef92?q=80&w=600&auto=format&fit=crop",
    reason: "UV index is 8 today and you have active pigmentation — non-greasy high protection.",
    ingredients: ["Tinosorb S", "Uvinul A Plus", "Silica"],
    benefits: ["No white cast", "Matte finish", "Sweat resistant"],
    suitable: "Oily · All tones",
    usage: "Morning · 2 finger lengths · reapply every 3h",
    stores: [
      { store: "Official Brand", price: 899, offer: "Free travel size", best: true, url: "https://example.com/brand/matte-spf" },
      { store: "Nykaa", price: 909, offer: "5% OFF", url: "https://nykaa.com/matte-spf" },
      { store: "Amazon", price: 939, offer: "—", url: "https://amazon.in/dp/B000SPF" },
      { store: "Flipkart", price: 929, offer: "Free delivery", url: "https://flipkart.com/matte-spf" },
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
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop",
    reason:
      "Shade matched to Medium depth with warm undertone; oil-control formula for your skin type.",
    ingredients: ["Silica", "Niacinamide", "Vitamin E"],
    benefits: ["12h wear", "Blurs pores", "Transfer resistant"],
    suitable: "Medium · Warm undertone · Oily",
    usage: "2 pumps · buff outward with damp sponge",
    stores: [
      { store: "Official Brand", price: 1250, offer: "10% OFF", url: "https://example.com/brand/blur-foundation" },
      { store: "Nykaa", price: 1125, offer: "Flat ₹125 OFF", best: true, url: "https://nykaa.com/blur-foundation" },
      { store: "Amazon", price: 1199, offer: "Coupon ₹50", url: "https://amazon.in/dp/B000BLUR" },
      { store: "Flipkart", price: 1180, offer: "Free delivery", url: "https://flipkart.com/blur-foundation" },
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
    image: "https://images.unsplash.com/photo-1596462502298-2850d5d05b5b?q=80&w=600&auto=format&fit=crop",
    reason: "Warm terracotta flatters golden undertones on medium depth skin.",
    ingredients: ["Squalane", "Jojoba Ester", "Mica"],
    benefits: ["Natural flush", "Blendable", "Buildable"],
    suitable: "Medium · Warm undertone",
    usage: "Tap 2 dots on cheekbones · blend with fingers",
    stores: [
      { store: "Official Brand", price: 640, offer: "—", url: "https://example.com/brand/cream-blush" },
      { store: "Nykaa", price: 595, offer: "7% OFF", best: true, url: "https://nykaa.com/cream-blush" },
      { store: "Amazon", price: 610, offer: "—", url: "https://amazon.in/dp/B000BLUSH" },
      { store: "Flipkart", price: 620, offer: "Free delivery", url: "https://flipkart.com/cream-blush" },
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
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop",
    reason: "Warm rose with brown depth reads harmonious against your undertone.",
    ingredients: ["Shea Butter", "Castor Oil", "Vitamin E"],
    benefits: ["Non-drying", "6h wear", "Satin finish"],
    suitable: "Warm undertone · All types",
    usage: "Apply from centre outward · blot once",
    stores: [
      { store: "Official Brand", price: 780, offer: "10% OFF", url: "https://example.com/brand/satin-lip" },
      { store: "Nykaa", price: 702, offer: "Flat ₹78 OFF", best: true, url: "https://nykaa.com/satin-lip" },
      { store: "Amazon", price: 749, offer: "—", url: "https://amazon.in/dp/B000LIP" },
      { store: "Flipkart", price: 760, offer: "Free delivery", url: "https://flipkart.com/satin-lip" },
    ],
  }
];

export const tutorials = [
  {
    title: "Morning skin routine",
    duration: "4 min",
    kind: "Skincare",
    steps: [
      {
        id: "intro1",
        description: "AI Consultation Intro",
        narration: "Hello! Based on your AI skin analysis, I've created a skincare routine specially for you. I noticed your skin leans oily, so today I'll show you exactly how to apply your recommended products.",
        durationSeconds: 15,
      },
      {
        id: "step1",
        description: "Wash face with Salicylic Gentle Face Wash — 30 seconds, lukewarm water.",
        narration: "Start by washing your face with the recommended Dermaline cleanser. Use a gentle circular motion for thirty to sixty seconds.",
        durationSeconds: 12,
        product: products.find(p => p.id === "cleanser")
      },
      {
        id: "step2",
        description: "Press 3 drops of Niacinamide Serum into damp skin, wait 60 seconds.",
        narration: "Next, apply two to three drops of the Solvea Niacinamide serum evenly across your face.",
        durationSeconds: 15,
        product: products.find(p => p.id === "serum")
      },
      {
        id: "step3",
        description: "Finish with 2 finger lengths of SPF 50 Matte Fluid, including ears and neck.",
        narration: "Finish your morning routine with Aurea sunscreen. Apply using the two-finger rule evenly on your face and neck.",
        durationSeconds: 14,
        product: products.find(p => p.id === "spf")
      },
    ],
  },
  {
    title: "Everyday warm-tone makeup",
    duration: "7 min",
    kind: "Makeup",
    steps: [
      {
        id: "m_step1",
        description: "Foundation 320 Warm Sand: 2 pumps, buff with damp sponge.",
        narration: "For your base, apply two pumps of Muse Studio foundation. Buff outward with a damp sponge for a flawless blur.",
        durationSeconds: 18,
        product: products.find(p => p.id === "foundation")
      },
      {
        id: "m_step2",
        description: "Cream blush Terracotta Warmth on cheekbones, blend upward.",
        narration: "Tap two dots of the Terracotta blush on your cheekbones and blend upward for a natural warm flush.",
        durationSeconds: 12,
        product: products.find(p => p.id === "blush")
      },
      {
        id: "m_step3",
        description: "Spiced Rose lipstick, then setting spray in an X and T motion.",
        narration: "Complete the look with Spiced Rose satin lip colour. Apply from the centre outward and blot once.",
        durationSeconds: 15,
        product: products.find(p => p.id === "lipstick")
      }
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
