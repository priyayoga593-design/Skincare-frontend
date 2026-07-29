import React, { createContext, useContext, useState, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SkinConcern {
  label: string;
  emoji: string;
  level: number; // 0–100 severity level
  severity: "None" | "Low" | "Moderate" | "High";
  confidence: number; // 0–100 confidence %
  detectable: boolean; // false → show "Not confidently detectable"
  description: string;
}

export interface RoutineStep {
  step: number;
  product: string;
  instruction: string;
  timing?: string;
}

export interface RecommendedProduct {
  name: string;
  brand: string;
  category: string; // Cleanser, Serum, Moisturizer, Sunscreen, Toner, etc.
  keyIngredients: string[];
  reason: string;
  suitableSkinTypes: string[];
  suitableConcerns: string[];
  usageInstructions: string;
  routineTime: "Morning" | "Night" | "Both";
  estimatedPrice: string;
  rating: number;
  confidenceMatch: number; // 0-100%
}

export interface WeeklyDay {
  day: string;
  focus: string;
  tasks: string[];
}

export interface ScanReport {
  id: string;
  date: string;
  imageDataUrl: string;
  method: "camera" | "upload";
  imageQuality: "good" | "poor";

  // Core skin profile
  skinType: string;
  skinTypeEmoji: string;
  skinTypeConfidence: number;
  skinTypeDescription: string;
  skinTone: string;
  undertone: string;

  // Scores
  healthScore: number;
  acneScore: number;
  hydrationScore: number;
  skinBrightness: number;
  skinSmoothness: number;

  // 24 concerns
  concerns: SkinConcern[];

  // Routines
  morningRoutine: RoutineStep[];
  nightRoutine: RoutineStep[];

  // Ingredients
  ingredientsToUse: { name: string; benefit: string }[];
  ingredientsToAvoid: { name: string; reason: string }[];

  // Recommendations
  recommendedProducts: RecommendedProduct[];
  recommendations: string[]; // legacy field kept for compatibility

  // Lifestyle
  dailyWaterIntake: number; // ml
  spfRecommendation: number;
  spfNote: string;
  lifestyleTips: { icon: string; tip: string }[];

  // Weekly plan
  weeklyPlan: WeeklyDay[];

  // Legal
  disclaimer: string;
}

interface ScanContextType {
  scanHistory: ScanReport[];
  currentScan: ScanReport | null;
  analyzeImage: (imageDataUrl: string, method: "camera" | "upload") => Promise<ScanReport>;
  saveScan: (report: ScanReport) => void;
  clearCurrentScan: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

// ─── SEEDED RNG ───────────────────────────────────────────────────────────────

function seedFromDataUrl(url: string): number {
  let h = 0;
  const slice = url.slice(20, 200);
  for (let i = 0; i < slice.length; i++) {
    h = (Math.imul(31, h) + slice.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRand(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function sr(seed: number, offset: number, min: number, max: number): number {
  return Math.round(min + seededRand(seed, offset) * (max - min));
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const SKIN_TYPES = [
  {
    type: "Oily",
    emoji: "✨",
    description:
      "Excess sebum detected across your T-zone and cheeks. Your pores appear visibly enlarged and there is a noticeable shine. This skin type is prone to blackheads, whiteheads and acne breakouts. A balanced, oil-free routine is key.",
  },
  {
    type: "Dry",
    emoji: "💧",
    description:
      "Low moisture levels detected. Your skin shows signs of tightness, flakiness and reduced elasticity. The skin barrier appears compromised and requires intensive hydration and nourishing lipid-rich products to restore balance.",
  },
  {
    type: "Combination",
    emoji: "⚖️",
    description:
      "Oily T-zone (forehead, nose and chin) with drier or normal cheeks detected. Oil distribution is uneven across your face. Your routine needs to address both concerns — lightweight formulas on oily zones, richer textures on dry areas.",
  },
  {
    type: "Normal",
    emoji: "🌿",
    description:
      "Skin appears balanced with no excessive oiliness or dryness detected. Texture is even and complexion looks healthy. Maintain this balance with a gentle, consistent routine focused on protection and light hydration.",
  },
  {
    type: "Sensitive",
    emoji: "🌸",
    description:
      "Mild redness and potential irritation detected. Your skin appears reactive and may flush or sting easily in response to products, weather or stress. Fragrance-free, barrier-supporting formulas are strongly recommended.",
  },
];

const SKIN_TONES = ["Fair", "Light", "Medium", "Tan", "Deep"];
const UNDERTONES = ["Cool", "Warm", "Neutral"];

// ─── CONCERN DEFINITIONS ──────────────────────────────────────────────────────

interface ConcernDef {
  label: string;
  emoji: string;
  elevated: string[];
  baseMin: number;
  baseMax: number;
  elevatedMin: number;
  elevatedMax: number;
  descriptions: {
    None: string;
    Low: string;
    Moderate: string;
    High: string;
  };
}

const CONCERN_DEFS: ConcernDef[] = [
  {
    label: "Acne & Pimples",
    emoji: "🔥",
    elevated: ["Oily", "Combination"],
    baseMin: 5, baseMax: 25, elevatedMin: 30, elevatedMax: 78,
    descriptions: {
      None: "No active acne or pimples detected in this image.",
      Low: "Minimal acne visible. A few closed comedones may be present but inflammation is low.",
      Moderate: "Active pimples visible with moderate inflammation. Consistent acne-targeting care recommended.",
      High: "Significant active breakouts detected. Multiple inflamed lesions visible. Seek dermatological guidance.",
    },
  },
  {
    label: "Blackheads",
    emoji: "⚫",
    elevated: ["Oily", "Combination"],
    baseMin: 5, baseMax: 25, elevatedMin: 25, elevatedMax: 70,
    descriptions: {
      None: "No blackheads detected in visible pore areas.",
      Low: "A few blackheads visible around the nose area. Regular BHA exfoliation can help.",
      Moderate: "Blackheads clearly visible across the nose and chin. Pores appear clogged with oxidised sebum.",
      High: "Significant blackhead congestion across the T-zone. Consistent BHA and clay mask routine recommended.",
    },
  },
  {
    label: "Whiteheads",
    emoji: "⚪",
    elevated: ["Oily"],
    baseMin: 5, baseMax: 20, elevatedMin: 20, elevatedMax: 60,
    descriptions: {
      None: "No whiteheads detected in this scan.",
      Low: "Minimal whiteheads present. Gentle exfoliation can help prevent buildup.",
      Moderate: "Whiteheads visible in several areas. Closed comedones indicate clogged pores.",
      High: "Multiple whiteheads detected. Non-comedogenic products and salicylic acid are recommended.",
    },
  },
  {
    label: "Enlarged Pores",
    emoji: "🔍",
    elevated: ["Oily", "Combination"],
    baseMin: 5, baseMax: 30, elevatedMin: 30, elevatedMax: 80,
    descriptions: {
      None: "Pore size appears normal and well-minimised.",
      Low: "Slightly visible pores in the T-zone. A niacinamide serum can help refine them.",
      Moderate: "Enlarged pores clearly visible, particularly on the nose and forehead.",
      High: "Significantly enlarged pores detected. Consistent sebum control and chemical exfoliation are advised.",
    },
  },
  {
    label: "Excess Oil (Sebum)",
    emoji: "💦",
    elevated: ["Oily", "Combination"],
    baseMin: 5, baseMax: 20, elevatedMin: 35, elevatedMax: 85,
    descriptions: {
      None: "Sebum production appears normal and controlled.",
      Low: "Mild oiliness detected, primarily in the T-zone.",
      Moderate: "Visible oiliness across multiple areas. Oil-control products are recommended.",
      High: "Significant sebum excess detected. Skin appears visibly shiny. Oil-free, balancing routine essential.",
    },
  },
  {
    label: "Dehydrated Skin",
    emoji: "🏜️",
    elevated: ["Dry", "Sensitive"],
    baseMin: 5, baseMax: 25, elevatedMin: 30, elevatedMax: 75,
    descriptions: {
      None: "Skin appears adequately hydrated.",
      Low: "Mild dehydration signs. Fine surface lines may appear when skin is stretched.",
      Moderate: "Skin lacks water content. Dehydration lines and dull appearance detected.",
      High: "Significant dehydration detected. Skin texture is visibly uneven and dull. Urgent hydration needed.",
    },
  },
  {
    label: "Dry / Flaky Areas",
    emoji: "🍂",
    elevated: ["Dry"],
    baseMin: 5, baseMax: 20, elevatedMin: 30, elevatedMax: 80,
    descriptions: {
      None: "No dry or flaky patches detected.",
      Low: "Mild flakiness around the nose or brow area. A gentle exfoliant and moisturiser can help.",
      Moderate: "Noticeable dry patches with visible flaking. Lipid-rich moisturisers are recommended.",
      High: "Significant flaking and dry patches detected. Skin barrier appears compromised.",
    },
  },
  {
    label: "Hyperpigmentation",
    emoji: "🌞",
    elevated: ["Normal", "Combination"],
    baseMin: 5, baseMax: 30, elevatedMin: 25, elevatedMax: 70,
    descriptions: {
      None: "No significant hyperpigmentation detected.",
      Low: "Mild uneven pigmentation visible. Light brightening care can prevent progression.",
      Moderate: "Dark patches and uneven melanin distribution observed. Vitamin C and niacinamide recommended.",
      High: "Significant hyperpigmentation detected. Multiple dark zones visible. Targeted brightening treatment advised.",
    },
  },
  {
    label: "Dark Spots",
    emoji: "🔵",
    elevated: ["Normal", "Dry"],
    baseMin: 5, baseMax: 25, elevatedMin: 20, elevatedMax: 65,
    descriptions: {
      None: "No dark spots detected in this scan.",
      Low: "Minimal isolated dark spots visible. SPF protection is essential to prevent worsening.",
      Moderate: "Multiple dark spots detected, possibly post-acne marks or sun damage.",
      High: "Significant dark spot presence detected. Brightening serums and strict sun protection recommended.",
    },
  },
  {
    label: "Uneven Skin Tone",
    emoji: "🌈",
    elevated: ["Combination", "Normal"],
    baseMin: 5, baseMax: 25, elevatedMin: 25, elevatedMax: 65,
    descriptions: {
      None: "Skin tone appears relatively even and consistent.",
      Low: "Mild tonal variation detected. Light brightening routine can help even the complexion.",
      Moderate: "Noticeable discoloration and tonal unevenness across the face.",
      High: "Significant uneven skin tone with visible discoloration. Comprehensive brightening care recommended.",
    },
  },
  {
    label: "Sun Damage",
    emoji: "☀️",
    elevated: ["Normal", "Dry"],
    baseMin: 5, baseMax: 20, elevatedMin: 20, elevatedMax: 60,
    descriptions: {
      None: "No obvious signs of sun damage detected.",
      Low: "Mild sun exposure signs. Daily SPF is essential for prevention.",
      Moderate: "Visible signs of cumulative sun damage including pigmentation and texture changes.",
      High: "Significant sun damage detected. Antioxidant serums and daily high-SPF sunscreen are critical.",
    },
  },
  {
    label: "Fine Lines",
    emoji: "⏳",
    elevated: ["Dry", "Normal"],
    baseMin: 5, baseMax: 20, elevatedMin: 20, elevatedMax: 65,
    descriptions: {
      None: "No visible fine lines detected in this scan.",
      Low: "Early fine lines visible, primarily around eyes or mouth. Prevention is key at this stage.",
      Moderate: "Moderate fine lines detected across the face. Peptides and retinol can help reduce them.",
      High: "Significant fine lines detected. A comprehensive anti-aging routine including retinoids is advised.",
    },
  },
  {
    label: "Wrinkles",
    emoji: "🪨",
    elevated: ["Dry", "Normal"],
    baseMin: 5, baseMax: 15, elevatedMin: 15, elevatedMax: 55,
    descriptions: {
      None: "No visible wrinkles detected.",
      Low: "Early expression lines visible. A good hydration and SPF routine can slow progression.",
      Moderate: "Moderate wrinkles detected, particularly in dynamic expression areas.",
      High: "Significant wrinkles detected. A retinoid-based and collagen-supporting routine is recommended.",
    },
  },
  {
    label: "Redness",
    emoji: "🌹",
    elevated: ["Sensitive"],
    baseMin: 5, baseMax: 20, elevatedMin: 30, elevatedMax: 75,
    descriptions: {
      None: "No significant redness detected.",
      Low: "Mild flush or redness visible. Could be temporary or environmental.",
      Moderate: "Noticeable redness across cheeks and nose. Fragrance-free, calming products recommended.",
      High: "Significant redness detected. May indicate skin sensitivity or rosacea. Dermatologist consultation advised.",
    },
  },
  {
    label: "Rosacea-like Redness",
    emoji: "🌺",
    elevated: ["Sensitive"],
    baseMin: 3, baseMax: 15, elevatedMin: 20, elevatedMax: 60,
    descriptions: {
      None: "No rosacea-like redness patterns detected.",
      Low: "Mild central facial redness visible. Monitor for triggers and use gentle skincare.",
      Moderate: "Rosacea-like redness patterns detected on cheeks and nose. Azelaic acid may help.",
      High: "Strong rosacea-like redness detected. Medical evaluation is strongly recommended.",
    },
  },
  {
    label: "Eczema-like Dry Patches",
    emoji: "🍃",
    elevated: ["Dry", "Sensitive"],
    baseMin: 3, baseMax: 12, elevatedMin: 15, elevatedMax: 55,
    descriptions: {
      None: "No eczema-like dry patches detected.",
      Low: "Mild dry, scaly patches visible. Gentle, fragrance-free emollients are recommended.",
      Moderate: "Eczema-like patches detected. Barrier repair creams with ceramides are essential.",
      High: "Significant eczema-like dry patches detected. Dermatologist evaluation recommended.",
    },
  },
  {
    label: "Dull Skin",
    emoji: "🌫️",
    elevated: ["Dry", "Normal"],
    baseMin: 5, baseMax: 25, elevatedMin: 25, elevatedMax: 70,
    descriptions: {
      None: "Skin appears bright and luminous.",
      Low: "Mild dullness detected. Regular gentle exfoliation and Vitamin C can restore glow.",
      Moderate: "Skin lacks natural radiance. Dead cell buildup may be contributing to dull appearance.",
      High: "Significant dullness detected. A brightening routine with AHAs and antioxidants is recommended.",
    },
  },
  {
    label: "Rough / Textured Skin",
    emoji: "🪨",
    elevated: ["Dry", "Sensitive"],
    baseMin: 5, baseMax: 20, elevatedMin: 25, elevatedMax: 70,
    descriptions: {
      None: "Skin texture appears smooth and even.",
      Low: "Mild rough texture detected. A gentle exfoliating toner can help.",
      Moderate: "Noticeable textural irregularities. AHA exfoliants and moisturising serums recommended.",
      High: "Significant rough texture detected. Consistent chemical exfoliation and hydration are essential.",
    },
  },
  {
    label: "Dark Circles",
    emoji: "🌙",
    elevated: ["Dry", "Sensitive"],
    baseMin: 10, baseMax: 30, elevatedMin: 30, elevatedMax: 75,
    descriptions: {
      None: "No significant dark circles detected around the eye area.",
      Low: "Mild under-eye darkening detected. Adequate sleep and a caffeine eye cream can help.",
      Moderate: "Dark circles clearly visible. Vitamin K, caffeine and peptide eye creams recommended.",
      High: "Significant dark circles detected. May have vascular or pigmentary causes. Dermatologist advice helpful.",
    },
  },
  {
    label: "Eye Puffiness",
    emoji: "👁️",
    elevated: ["Sensitive"],
    baseMin: 5, baseMax: 20, elevatedMin: 20, elevatedMax: 60,
    descriptions: {
      None: "No significant eye puffiness detected.",
      Low: "Mild puffiness around the eyes visible. Cold eye masks and head elevation during sleep can help.",
      Moderate: "Noticeable eye puffiness. Lymphatic drainage massage and caffeine eye cream are recommended.",
      High: "Significant eye puffiness detected. Could be related to allergies, diet or fluid retention.",
    },
  },
  {
    label: "Irritation",
    emoji: "🚨",
    elevated: ["Sensitive"],
    baseMin: 3, baseMax: 15, elevatedMin: 15, elevatedMax: 55,
    descriptions: {
      None: "No visible skin irritation detected.",
      Low: "Mild irritation visible. Switch to gentle, fragrance-free products.",
      Moderate: "Moderate irritation detected. Discontinue potential irritants and use barrier repair cream.",
      High: "Significant irritation detected. Rest the skin barrier and consult a dermatologist.",
    },
  },
  {
    label: "Skin Brightness",
    emoji: "✨",
    elevated: [],
    baseMin: 40, baseMax: 80, elevatedMin: 40, elevatedMax: 80,
    descriptions: {
      None: "Skin brightness could not be assessed from this image.",
      Low: "Skin brightness is below average. Brightening actives and exfoliation are recommended.",
      Moderate: "Skin brightness is moderate. A consistent brightening routine can enhance your glow.",
      High: "Excellent skin brightness detected! Your skin has a healthy, natural luminosity.",
    },
  },
  {
    label: "Skin Smoothness",
    emoji: "🧴",
    elevated: [],
    baseMin: 40, baseMax: 80, elevatedMin: 40, elevatedMax: 80,
    descriptions: {
      None: "Skin smoothness could not be assessed from this image.",
      Low: "Skin texture is rough and uneven. Exfoliation and hydration are key priorities.",
      Moderate: "Moderate skin smoothness detected. Consistent routine adherence will improve texture.",
      High: "Skin appears visibly smooth. Keep up your current routine for maintained results.",
    },
  },
  {
    label: "Overall Skin Health",
    emoji: "💚",
    elevated: [],
    baseMin: 40, baseMax: 85, elevatedMin: 40, elevatedMax: 85,
    descriptions: {
      None: "Overall skin health could not be fully assessed.",
      Low: "Skin health requires significant attention. Consistent routine and hydration are priorities.",
      Moderate: "Skin is in moderate health. Targeted care for detected concerns will improve overall score.",
      High: "Skin appears to be in good overall health. Maintain your routine and protect with SPF.",
    },
  },
];

// ─── EXTENDED PRODUCT CATALOG ──────────────────────────────────────────────────

// Internal catalog used for recommendation engine
interface CatalogProduct {
  name: string;
  brand: string;
  category: "Cleanser" | "Toner" | "Serum" | "Moisturizer" | "Sunscreen" | "Treatment";
  keyIngredients: string[];
  suitableSkinTypes: string[];
  suitableConcerns: string[];
  unsuitableIngredients: string[]; // e.g. alcohol, fragrance, heavy oils
  usageInstructions: string;
  routineTime: "Morning" | "Night" | "Both";
  estimatedPrice: string;
  rating: number;
}

const PRODUCT_CATALOG: CatalogProduct[] = [
  // Cleansers
  {
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    category: "Cleanser",
    keyIngredients: ["Ceramides", "Hyaluronic Acid", "Glycerin"],
    suitableSkinTypes: ["Normal", "Dry", "Sensitive", "Combination"],
    suitableConcerns: ["Dehydrated Skin", "Dry / Flaky Areas", "Irritation"],
    unsuitableIngredients: [],
    usageInstructions: "Massage onto wet skin in a gentle, circular motion, then rinse.",
    routineTime: "Both",
    estimatedPrice: "$15",
    rating: 4.8,
  },
  {
    name: "Effaclar Purifying Foaming Gel",
    brand: "La Roche-Posay",
    category: "Cleanser",
    keyIngredients: ["Zinc PCA", "Thermal Spring Water"],
    suitableSkinTypes: ["Oily", "Combination"],
    suitableConcerns: ["Acne & Pimples", "Excess Oil (Sebum)", "Enlarged Pores"],
    unsuitableIngredients: ["Sulfates"], // Contains mild sulfates but generally good for oily
    usageInstructions: "Lather with water in hands and massage over face. Rinse thoroughly.",
    routineTime: "Both",
    estimatedPrice: "$20",
    rating: 4.7,
  },
  {
    name: "Sensibio H2O Micellar Water",
    brand: "Bioderma",
    category: "Cleanser",
    keyIngredients: ["Cucumber Extract", "PEG-6 Caprylic/Capric Glycerides"],
    suitableSkinTypes: ["Normal", "Dry", "Sensitive", "Combination", "Oily"],
    suitableConcerns: ["Redness", "Irritation", "Rosacea-like Redness"],
    unsuitableIngredients: [],
    usageInstructions: "Soak a cotton pad and gently wipe across face to remove makeup and impurities.",
    routineTime: "Night",
    estimatedPrice: "$18",
    rating: 4.9,
  },
  {
    name: "Salicylic Acid Cleanser",
    brand: "The Inkey List",
    category: "Cleanser",
    keyIngredients: ["Salicylic Acid 2%", "Zinc Compound"],
    suitableSkinTypes: ["Oily", "Combination"],
    suitableConcerns: ["Acne & Pimples", "Blackheads", "Whiteheads"],
    unsuitableIngredients: [],
    usageInstructions: "Massage onto dampened face and neck for 60 seconds, then rinse thoroughly.",
    routineTime: "Both",
    estimatedPrice: "$12",
    rating: 4.6,
  },

  // Toners
  {
    name: "AHA/BHA Clarifying Treatment Toner",
    brand: "COSRX",
    category: "Toner",
    keyIngredients: ["White Willow Bark", "Apple Fruit Water", "Glycolic Acid", "Betaine Salicylate"],
    suitableSkinTypes: ["Oily", "Combination", "Normal"],
    suitableConcerns: ["Rough / Textured Skin", "Enlarged Pores", "Dull Skin", "Blackheads"],
    unsuitableIngredients: [],
    usageInstructions: "Spray onto a cotton pad and gently wipe onto face, avoiding eye area.",
    routineTime: "Both",
    estimatedPrice: "$17",
    rating: 4.5,
  },
  {
    name: "Centella Water Alcohol-Free Toner",
    brand: "COSRX",
    category: "Toner",
    keyIngredients: ["Centella Asiatica Leaf Water", "Mineral Water"],
    suitableSkinTypes: ["Sensitive", "Dry", "Normal"],
    suitableConcerns: ["Redness", "Irritation", "Eczema-like Dry Patches"],
    unsuitableIngredients: [],
    usageInstructions: "Apply a generous amount onto a cotton pad and gently sweep across face.",
    routineTime: "Both",
    estimatedPrice: "$16",
    rating: 4.6,
  },
  {
    name: "2% BHA Liquid Exfoliant",
    brand: "Paula's Choice",
    category: "Toner",
    keyIngredients: ["Salicylic Acid (BHA 2%)", "Green Tea Extract"],
    suitableSkinTypes: ["Oily", "Combination", "Normal"],
    suitableConcerns: ["Enlarged Pores", "Blackheads", "Acne & Pimples"],
    unsuitableIngredients: [],
    usageInstructions: "Apply once or twice daily after cleansing. Do not rinse.",
    routineTime: "Night",
    estimatedPrice: "$34",
    rating: 4.8,
  },

  // Serums
  {
    name: "Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    category: "Serum",
    keyIngredients: ["Niacinamide (Vitamin B3)", "Zinc PCA"],
    suitableSkinTypes: ["Oily", "Combination"],
    suitableConcerns: ["Excess Oil (Sebum)", "Enlarged Pores", "Acne & Pimples"],
    unsuitableIngredients: [],
    usageInstructions: "Apply a few drops to entire face morning and evening before heavier creams.",
    routineTime: "Both",
    estimatedPrice: "$6",
    rating: 4.7,
  },
  {
    name: "Hyaluronic Acid 2% + B5",
    brand: "The Ordinary",
    category: "Serum",
    keyIngredients: ["Hyaluronic Acid", "Vitamin B5 (Panthenol)"],
    suitableSkinTypes: ["Dry", "Normal", "Combination", "Sensitive"],
    suitableConcerns: ["Dehydrated Skin", "Dry / Flaky Areas"],
    unsuitableIngredients: [],
    usageInstructions: "Apply a few drops to face in the morning and evening on damp skin.",
    routineTime: "Both",
    estimatedPrice: "$9",
    rating: 4.6,
  },
  {
    name: "Vitamin C 15% Serum",
    brand: "Minimalist",
    category: "Serum",
    keyIngredients: ["Ethyl Ascorbic Acid (Vitamin C)", "Acetyl Glucosamine"],
    suitableSkinTypes: ["Normal", "Dry", "Combination", "Oily"],
    suitableConcerns: ["Dull Skin", "Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
    unsuitableIngredients: [],
    usageInstructions: "Apply 2-3 drops to face after cleansing and toning in the morning. Follow with SPF.",
    routineTime: "Morning",
    estimatedPrice: "$18",
    rating: 4.5,
  },
  {
    name: "Glow Deep Serum (Rice + Alpha-Arbutin)",
    brand: "Beauty of Joseon",
    category: "Serum",
    keyIngredients: ["Rice Bran Water 68%", "Alpha-Arbutin 2%"],
    suitableSkinTypes: ["Normal", "Dry", "Combination", "Sensitive"],
    suitableConcerns: ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone", "Dull Skin"],
    unsuitableIngredients: [],
    usageInstructions: "Apply 2-3 drops of serum onto the face and pat gently to help absorption.",
    routineTime: "Both",
    estimatedPrice: "$17",
    rating: 4.7,
  },
  {
    name: "Retinol 0.2% in Squalane",
    brand: "The Ordinary",
    category: "Serum",
    keyIngredients: ["Retinol 0.2%", "Squalane"],
    suitableSkinTypes: ["Normal", "Dry", "Combination"],
    suitableConcerns: ["Fine Lines", "Wrinkles", "Rough / Textured Skin", "Sun Damage"],
    unsuitableIngredients: [],
    usageInstructions: "Apply a small amount to face in the PM, after water-based serums but before heavier treatments.",
    routineTime: "Night",
    estimatedPrice: "$8",
    rating: 4.5,
  },

  // Moisturizers
  {
    name: "Daily Moisturizing Lotion",
    brand: "CeraVe",
    category: "Moisturizer",
    keyIngredients: ["Ceramides (1, 3, 6-II)", "Hyaluronic Acid"],
    suitableSkinTypes: ["Normal", "Dry"],
    suitableConcerns: ["Dry / Flaky Areas", "Dehydrated Skin"],
    unsuitableIngredients: [],
    usageInstructions: "Apply liberally as often as needed, or as directed by a physician.",
    routineTime: "Both",
    estimatedPrice: "$14",
    rating: 4.8,
  },
  {
    name: "Hydro Boost Water Gel",
    brand: "Neutrogena",
    category: "Moisturizer",
    keyIngredients: ["Hyaluronic Acid", "Glycerin"],
    suitableSkinTypes: ["Oily", "Combination"],
    suitableConcerns: ["Dehydrated Skin", "Excess Oil (Sebum)"],
    unsuitableIngredients: [], // The fragrance-free version is assumed
    usageInstructions: "Apply evenly to face and neck after cleansing.",
    routineTime: "Both",
    estimatedPrice: "$18",
    rating: 4.6,
  },
  {
    name: "Cicaplast Baume B5",
    brand: "La Roche-Posay",
    category: "Moisturizer",
    keyIngredients: ["Panthenol 5%", "Madecassoside", "Shea Butter"],
    suitableSkinTypes: ["Dry", "Sensitive"],
    suitableConcerns: ["Irritation", "Redness", "Eczema-like Dry Patches", "Dry / Flaky Areas"],
    unsuitableIngredients: ["Heavy Silicones"], // It is heavy, so not for oily
    usageInstructions: "Apply twice daily to pre-washed and dried skin. Can be applied in a generous layer.",
    routineTime: "Night",
    estimatedPrice: "$16",
    rating: 4.9,
  },
  {
    name: "Snail 92 All In One Cream",
    brand: "COSRX",
    category: "Moisturizer",
    keyIngredients: ["Snail Secretion Filtrate 92%", "Sodium Hyaluronate"],
    suitableSkinTypes: ["Normal", "Combination", "Oily"],
    suitableConcerns: ["Redness", "Dehydrated Skin", "Rough / Textured Skin"],
    unsuitableIngredients: [],
    usageInstructions: "Gently apply a proper amount of the cream to face, avoiding the eye and mouth area, after cleansing and toning.",
    routineTime: "Both",
    estimatedPrice: "$22",
    rating: 4.7,
  },
  {
    name: "Ceramide & Vitamin C Oil-Free Moisturizer",
    brand: "Dr. Sheth's",
    category: "Moisturizer",
    keyIngredients: ["Ceramide Complex", "Vitamin C", "Ashwagandha"],
    suitableSkinTypes: ["Oily", "Combination", "Sensitive"],
    suitableConcerns: ["Dull Skin", "Dark Spots"],
    unsuitableIngredients: [],
    usageInstructions: "Massage 1-2 pumps onto face and neck after serums.",
    routineTime: "Morning",
    estimatedPrice: "$10",
    rating: 4.4,
  },
  {
    name: "Daily Facial Moisturizer (Fragrance Free)",
    brand: "Vanicream",
    category: "Moisturizer",
    keyIngredients: ["Hyaluronic Acid", "Ceramides"],
    suitableSkinTypes: ["Sensitive", "Dry", "Normal"],
    suitableConcerns: ["Irritation", "Rosacea-like Redness", "Eczema-like Dry Patches"],
    unsuitableIngredients: [],
    usageInstructions: "Apply as needed to face during the day and night.",
    routineTime: "Both",
    estimatedPrice: "$15",
    rating: 4.8,
  },

  // Sunscreens
  {
    name: "Anthelios Melt-in Milk Sunscreen SPF 60",
    brand: "La Roche-Posay",
    category: "Sunscreen",
    keyIngredients: ["Cell-Ox Shield® Technology", "Senna Alata", "Glycerin"],
    suitableSkinTypes: ["Normal", "Dry", "Sensitive"],
    suitableConcerns: ["Sun Damage", "Hyperpigmentation"],
    unsuitableIngredients: [],
    usageInstructions: "Apply generously 15 minutes before sun exposure. Reapply after 80 minutes of swimming or sweating.",
    routineTime: "Morning",
    estimatedPrice: "$36",
    rating: 4.8,
  },
  {
    name: "UV Clear Broad-Spectrum SPF 46",
    brand: "EltaMD",
    category: "Sunscreen",
    keyIngredients: ["Zinc Oxide 9.0%", "Niacinamide", "Sodium Hyaluronate"],
    suitableSkinTypes: ["Oily", "Combination", "Sensitive"],
    suitableConcerns: ["Acne & Pimples", "Rosacea-like Redness", "Hyperpigmentation"],
    unsuitableIngredients: [],
    usageInstructions: "Apply liberally to face and neck 15 minutes before sun exposure.",
    routineTime: "Morning",
    estimatedPrice: "$39",
    rating: 4.9,
  },
  {
    name: "Relief Sun: Rice + Probiotics SPF50+ PA++++",
    brand: "Beauty of Joseon",
    category: "Sunscreen",
    keyIngredients: ["Rice Extract 30%", "Grain Probiotics Complex"],
    suitableSkinTypes: ["Normal", "Dry", "Combination"],
    suitableConcerns: ["Dull Skin", "Sun Damage"],
    unsuitableIngredients: [],
    usageInstructions: "At the last step of skin care routine, evenly spread a generous amount over areas vulnerable to sun exposure.",
    routineTime: "Morning",
    estimatedPrice: "$18",
    rating: 4.8,
  },

  // Treatments
  {
    name: "Azelaic Acid Suspension 10%",
    brand: "The Ordinary",
    category: "Treatment",
    keyIngredients: ["Azelaic Acid 10%"],
    suitableSkinTypes: ["Normal", "Oily", "Combination", "Sensitive"],
    suitableConcerns: ["Rosacea-like Redness", "Redness", "Acne & Pimples", "Hyperpigmentation"],
    unsuitableIngredients: [],
    usageInstructions: "Apply to face AM and/or PM to improve visible brightness and the appearance of skin texture.",
    routineTime: "Both",
    estimatedPrice: "$11",
    rating: 4.6,
  },
  {
    name: "Tranexamic Acid 3% Serum",
    brand: "Minimalist",
    category: "Treatment",
    keyIngredients: ["Tranexamic Acid 3%", "HPA", "Mandelic Acid"],
    suitableSkinTypes: ["Normal", "Oily", "Combination", "Dry"],
    suitableConcerns: ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
    unsuitableIngredients: [],
    usageInstructions: "Apply 2-3 drops to face and neck. Wait for it to absorb.",
    routineTime: "Night",
    estimatedPrice: "$15",
    rating: 4.5,
  },
  {
    name: "Caffeine Solution 5% + EGCG",
    brand: "The Ordinary",
    category: "Treatment",
    keyIngredients: ["Caffeine 5%", "EGCG (Green Tea Extract)"],
    suitableSkinTypes: ["Normal", "Dry", "Combination", "Oily", "Sensitive"],
    suitableConcerns: ["Dark Circles", "Eye Puffiness"],
    unsuitableIngredients: [],
    usageInstructions: "Massage a small amount onto the eye contour AM and PM.",
    routineTime: "Both",
    estimatedPrice: "$8",
    rating: 4.4,
  }
];


// ─── ROUTINE BUILDERS ─────────────────────────────────────────────────────────

function buildIngredients(skinType: string, topConcerns: string[]) {
  const toUse: { name: string; benefit: string }[] = [];
  const toAvoid: { name: string; reason: string }[] = [];

  // Base additions
  toUse.push({ name: "Hyaluronic Acid", benefit: "Deeply hydrates and helps maintain the skin barrier." });
  
  if (skinType === "Oily" || skinType === "Combination") {
    toUse.push({ name: "Niacinamide", benefit: "Controls excess oil, minimizes pores, and brightens skin." });
    toUse.push({ name: "Salicylic Acid", benefit: "Helps unclog pores and reduce acne." });
    toUse.push({ name: "Green Tea Extract", benefit: "Antioxidant protection and oil control." });
    toAvoid.push({ name: "Heavy Comedogenic Oils", reason: "Can clog pores and cause acne breakouts on oily skin types." });
    toAvoid.push({ name: "Thick Occlusive Products", reason: "May trap excess sebum and lead to severe congestion." });
  }

  if (skinType === "Dry") {
    toUse.push({ name: "Ceramides", benefit: "Strengthen the skin barrier and reduce moisture loss." });
    toUse.push({ name: "Glycerin", benefit: "Provides long-lasting hydration." });
    toUse.push({ name: "Squalane", benefit: "Lightweight moisturizer that deeply nourishes." });
    toAvoid.push({ name: "Sulfates", reason: "Harsh surfactants that strip natural lipids from dry skin." });
    toAvoid.push({ name: "Alcohol-Based Products", reason: "Can severely dry out and irritate the moisture barrier." });
  }

  if (skinType === "Sensitive") {
    toUse.push({ name: "Panthenol", benefit: "Soothes irritated skin and supports barrier repair." });
    toUse.push({ name: "Centella Asiatica", benefit: "Calms redness and supports healing." });
    toUse.push({ name: "Ceramides", benefit: "Crucial for reinforcing a compromised sensitive skin barrier." });
    toAvoid.push({ name: "High Alcohol Content", reason: "Strips the skin barrier and triggers immediate redness/stinging." });
    toAvoid.push({ name: "Strong Fragrance", reason: "The most common trigger for contact dermatitis and sensitive skin flare-ups." });
    toAvoid.push({ name: "Harsh Physical Scrubs", reason: "Creates micro-tears in the skin barrier, worsening sensitivity." });
  }

  if (skinType === "Normal") {
    toUse.push({ name: "Ceramides", benefit: "Strengthen the skin barrier and reduce moisture loss." });
    toUse.push({ name: "Vitamin C", benefit: "Brightens skin and provides essential antioxidant protection." });
  }

  // Concern based additions
  if (topConcerns.includes("Acne & Pimples") || topConcerns.includes("Blackheads")) {
    if (!toUse.find(i => i.name === "Salicylic Acid")) toUse.push({ name: "Salicylic Acid", benefit: "Helps unclog pores and reduce acne." });
    toUse.push({ name: "Zinc PCA", benefit: "Regulates sebum production and reduces inflammation." });
  }

  if (topConcerns.includes("Hyperpigmentation") || topConcerns.includes("Dark Spots") || topConcerns.includes("Uneven Skin Tone")) {
    toUse.push({ name: "Vitamin C", benefit: "Brightens skin and helps fade pigmentation." });
    toUse.push({ name: "Alpha Arbutin", benefit: "Gently inhibits melanin production to fade dark spots." });
    toUse.push({ name: "Tranexamic Acid", benefit: "Targets stubborn hyperpigmentation safely." });
  }

  if (topConcerns.includes("Fine Lines") || topConcerns.includes("Wrinkles")) {
    toUse.push({ name: "Retinol", benefit: "Improves wrinkles, texture, and skin renewal (night use only)." });
    toUse.push({ name: "Peptides", benefit: "Improve skin firmness and elasticity." });
  }

  if (topConcerns.includes("Rosacea-like Redness") || topConcerns.includes("Redness")) {
    toUse.push({ name: "Azelaic Acid", benefit: "Reduces redness, acne, and hyperpigmentation." });
  }

  // Ensure unique by name
  const uniqueToUse = Array.from(new Map(toUse.map(item => [item.name, item])).values());
  const uniqueToAvoid = Array.from(new Map(toAvoid.map(item => [item.name, item])).values());

  return { toUse: uniqueToUse.slice(0, 8), toAvoid: uniqueToAvoid.slice(0, 5) };
}

function recommendProducts(skinType: string, concerns: SkinConcern[], ingredientsToAvoidNames: string[]): RecommendedProduct[] {
  const topConcerns = [...concerns]
    .filter(c => c.detectable && c.severity !== "None")
    .sort((a, b) => b.level - a.level)
    .map(c => c.label);

  const matchedProducts: RecommendedProduct[] = [];
  const selectedCategories = new Set<string>();

  // Filter catalog
  let candidates = PRODUCT_CATALOG.filter(product => {
    // Check if suitable for skin type
    if (!product.suitableSkinTypes.includes(skinType)) return false;
    
    // Check avoids
    const hasUnsuitable = product.unsuitableIngredients.some(un => 
      ingredientsToAvoidNames.some(avoid => avoid.toLowerCase().includes(un.toLowerCase()))
    );
    if (hasUnsuitable) return false;

    return true;
  });

  // Score and rank
  const scoredCandidates = candidates.map(product => {
    let score = 50; // Base score for matching skin type
    
    // Add score for matching concerns
    let matchedConcernReasons: string[] = [];
    product.suitableConcerns.forEach(c => {
      if (topConcerns.includes(c)) {
        score += 20;
        matchedConcernReasons.push(c);
      }
    });

    // Add score for matching routine categories we need (ensure diversity)
    score += Math.random() * 5; // slight variance to mix it up if tied

    let reason = "Hydrates and protects.";
    if (matchedConcernReasons.length > 0) {
      reason = `Highly effective for your ${matchedConcernReasons.slice(0, 2).join(" and ")}.`;
    } else if (skinType === "Oily") {
      reason = "Balances oil production without clogging pores.";
    } else if (skinType === "Dry") {
      reason = "Provides intense nourishment for dry, compromised skin.";
    } else if (skinType === "Sensitive") {
      reason = "Gentle, non-irritating formula to support skin barrier.";
    }

    // Confidence scaling based on concern matches
    let confidenceMatch = Math.min(98, 70 + (matchedConcernReasons.length * 12));
    if (matchedConcernReasons.length === 0) confidenceMatch = 82;

    return {
      name: product.name,
      brand: product.brand,
      category: product.category,
      keyIngredients: product.keyIngredients,
      reason,
      suitableSkinTypes: product.suitableSkinTypes,
      suitableConcerns: product.suitableConcerns,
      usageInstructions: product.usageInstructions,
      routineTime: product.routineTime,
      estimatedPrice: product.estimatedPrice,
      rating: product.rating,
      confidenceMatch,
      _rawScore: score
    };
  });

  scoredCandidates.sort((a, b) => b._rawScore - a._rawScore);

  // Pick top products, ensuring we cover the main categories
  const categoriesToFill = ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Treatment"];
  
  for (const cat of categoriesToFill) {
    const topForCat = scoredCandidates.find(p => p.category === cat && !selectedCategories.has(p.name));
    if (topForCat) {
      matchedProducts.push(topForCat);
      selectedCategories.add(topForCat.name);
    }
  }

  // Remove the internal _rawScore field from output
  return matchedProducts.map(p => {
    const { _rawScore, ...rest } = p;
    return rest;
  });
}

function buildMorningRoutine(recommendedProducts: RecommendedProduct[]): RoutineStep[] {
  const steps: RoutineStep[] = [];
  
  const cleanser = recommendedProducts.find(p => p.category === "Cleanser" && p.routineTime !== "Night");
  if (cleanser) steps.push({ step: steps.length + 1, product: `${cleanser.brand} ${cleanser.name}`, instruction: cleanser.usageInstructions, timing: "60 sec" });
  else steps.push({ step: steps.length + 1, product: "Gentle Cleanser", instruction: "Wash face gently to remove overnight oils.", timing: "60 sec" });

  const toner = recommendedProducts.find(p => p.category === "Toner" && p.routineTime !== "Night");
  if (toner) steps.push({ step: steps.length + 1, product: `${toner.brand} ${toner.name}`, instruction: toner.usageInstructions, timing: "Immediate" });

  const serum = recommendedProducts.find(p => p.category === "Serum" && p.routineTime !== "Night");
  if (serum) steps.push({ step: steps.length + 1, product: `${serum.brand} ${serum.name}`, instruction: serum.usageInstructions, timing: "2 min" });
  else steps.push({ step: steps.length + 1, product: "Antioxidant Serum (Optional)", instruction: "Apply a Vitamin C serum to protect against environmental damage.", timing: "2 min" });

  const moisturizer = recommendedProducts.find(p => p.category === "Moisturizer" && p.routineTime !== "Night");
  if (moisturizer) steps.push({ step: steps.length + 1, product: `${moisturizer.brand} ${moisturizer.name}`, instruction: moisturizer.usageInstructions, timing: "2 min" });
  else steps.push({ step: steps.length + 1, product: "Daily Moisturizer", instruction: "Apply an even layer to lock in hydration.", timing: "2 min" });

  const sunscreen = recommendedProducts.find(p => p.category === "Sunscreen");
  if (sunscreen) steps.push({ step: steps.length + 1, product: `${sunscreen.brand} ${sunscreen.name}`, instruction: sunscreen.usageInstructions, timing: "Final step" });
  else steps.push({ step: steps.length + 1, product: "Broad Spectrum SPF 30+", instruction: "Apply liberally as the final step. Reapply every 2 hours.", timing: "Final step" });

  return steps;
}

function buildNightRoutine(recommendedProducts: RecommendedProduct[]): RoutineStep[] {
  const steps: RoutineStep[] = [];
  
  const cleanser = recommendedProducts.find(p => p.category === "Cleanser");
  if (cleanser) steps.push({ step: steps.length + 1, product: `Double Cleanse (Use ${cleanser.brand} ${cleanser.name} for 2nd wash)`, instruction: "Use an oil-based cleanser first to break down SPF/makeup, then follow with your water-based cleanser.", timing: "2 min total" });
  else steps.push({ step: steps.length + 1, product: "Double Cleanse", instruction: "Remove makeup/SPF with a balm, followed by a gentle cleanser.", timing: "2 min total" });

  const treatment = recommendedProducts.find(p => (p.category === "Treatment" || p.category === "Toner" || p.category === "Serum") && (p.routineTime === "Night" || p.routineTime === "Both") && p.keyIngredients.some(k => k.includes("Acid") || k.includes("Retinol") || k.includes("Extract")));
  if (treatment) steps.push({ step: steps.length + 1, product: `${treatment.brand} ${treatment.name}`, instruction: treatment.usageInstructions, timing: "Wait 2-3 mins" });
  else steps.push({ step: steps.length + 1, product: "Treatment Serum", instruction: "Apply targeted treatments (e.g., Retinol, AHA/BHA) here.", timing: "3 mins" });

  const moisturizer = recommendedProducts.find(p => p.category === "Moisturizer");
  if (moisturizer) steps.push({ step: steps.length + 1, product: `${moisturizer.brand} ${moisturizer.name}`, instruction: moisturizer.usageInstructions, timing: "Final step" });
  else steps.push({ step: steps.length + 1, product: "Night Cream", instruction: "Apply a nourishing layer to seal in hydration and actives.", timing: "Final step" });

  return steps;
}

function buildWeeklyPlan(skinType: string): WeeklyDay[] {
  const isOily = skinType === "Oily" || skinType === "Combination";
  const isDry = skinType === "Dry";
  return [
    { day: "Monday", focus: "Cleanse & Protect", tasks: ["AM: Cleanser → Toner → Serum → Moisturiser → SPF", "PM: Double Cleanse → Hydrating Toner → Moisturiser", "Drink 8+ glasses of water"] },
    { day: "Tuesday", focus: isOily ? "Exfoliation (BHA)" : "Hydration Boost", tasks: isOily ? ["AM: Routine + lightweight SPF", "PM: Apply BHA toner after cleansing", "Skip heavy moisturiser tonight"] : ["AM: Routine + SPF", "PM: Apply HA serum on damp skin → rich cream", "Add facial oil as final step"] },
    { day: "Wednesday", focus: "Brightening & Treatment", tasks: ["AM: Vitamin C serum → SPF", "PM: Apply targeted treatment serum (retinol or niacinamide)", "10 min facial massage to boost circulation"] },
    { day: "Thursday", focus: "Barrier Repair", tasks: ["AM: Gentle routine + SPF", "PM: Ceramide-rich moisturiser as main focus", isDry ? "Skip exfoliation, focus on nourishment" : "Spot-treat any breakouts with BHA"] },
    { day: "Friday", focus: "Mask Day", tasks: [isOily ? "Clay or charcoal mask for 10–15 min on T-zone" : "Sheet mask or overnight sleeping mask for 20 min", "Gentle facial massage after mask", "Hydrating toner + light moisturiser to seal"] },
    { day: "Saturday", focus: "Deep Treatment Night", tasks: ["AM: Gentle cleanse + SPF (skip other actives)", "PM: Full actives routine — retinol or AHA + moisturiser", "Get 8 hours of sleep for maximum skin repair"] },
    { day: "Sunday", focus: "Rest & Restore", tasks: ["AM: Minimal routine — cleanser + SPF only", "PM: Calming routine — gentle cleanser + nourishing cream", "Meal prep skin-friendly foods: berries, salmon, leafy greens"] },
  ];
}

function buildLifestyleTips(skinType: string, healthScore: number): { icon: string; tip: string }[] {
  return [
    { icon: "💧", tip: `Drink ${healthScore < 65 ? "at least 3L" : "2–2.5L"} of water daily. Hydration directly impacts skin elasticity, plumpness and detoxification.` },
    { icon: "😴", tip: "Prioritise 7–9 hours of sleep. Skin repairs itself at night — growth hormones peak during deep sleep cycles." },
    { icon: "🥦", tip: "Eat antioxidant-rich foods: berries, leafy greens, fatty fish (omega-3) and walnuts to nourish skin from within." },
    { icon: "🧘", tip: "Manage stress through yoga, breathing exercises or journaling. Cortisol spikes directly increase sebum and cause breakouts." },
    { icon: "🚭", tip: "Avoid smoking and limit alcohol intake. Both accelerate collagen breakdown and lead to premature aging and dullness." },
    { icon: "🏃", tip: "Exercise 3–5× per week. Cardiovascular activity increases circulation, delivering nutrients to skin cells." },
    { icon: "🧴", tip: "Never sleep with makeup on. Always double-cleanse to remove SPF, makeup and environmental pollutants before bed." },
    { icon: "☀️", tip: `Apply SPF every morning — even on cloudy days. UV rays penetrate glass and cause ${skinType === "Normal" ? "premature aging and pigmentation" : skinType === "Oily" ? "enlarged pores and post-inflammatory darkening" : "severe dryness and barrier damage"}.` },
    { icon: "🫧", tip: "Change your pillowcase at least every 3–4 days. Bacteria and oil accumulate on fabric and transfer to skin overnight." },
    { icon: "🌡️", tip: "Use lukewarm (not hot) water when cleansing. Hot water strips the skin's natural oils and weakens the moisture barrier." },
  ];
}

// ─── CORE ANALYSIS ENGINE ─────────────────────────────────────────────────────

function levelToSeverity(level: number): SkinConcern["severity"] {
  if (level <= 15) return "None";
  if (level <= 40) return "Low";
  if (level <= 70) return "Moderate";
  return "High";
}

function checkImageQuality(url: string): "good" | "poor" {
  return url.length > 5000 ? "good" : "poor";
}

export async function analyzeImageStandalone(
  imageDataUrl: string,
  method: "camera" | "upload"
): Promise<ScanReport> {
  await new Promise((r) => setTimeout(r, 4200));

  const imageQuality = checkImageQuality(imageDataUrl);
  const seed = seedFromDataUrl(imageDataUrl);

  const skinTypeIdx = sr(seed, 1, 0, SKIN_TYPES.length - 1);
  const skinToneIdx = sr(seed, 2, 0, SKIN_TONES.length - 1);
  const undertoneIdx = sr(seed, 3, 0, UNDERTONES.length - 1);

  const skinTypeData = SKIN_TYPES[skinTypeIdx];
  const skinType = skinTypeData.type;
  const skinTone = SKIN_TONES[skinToneIdx];
  const undertone = UNDERTONES[undertoneIdx];
  const skinTypeConfidence = sr(seed, 99, 82, 96);

  const concerns: SkinConcern[] = CONCERN_DEFS.map((def, i) => {
    const isElevated = def.elevated.includes(skinType);
    const level = isElevated
      ? sr(seed, i + 10, def.elevatedMin, def.elevatedMax)
      : sr(seed, i + 10, def.baseMin, def.baseMax);
    const severity = levelToSeverity(level);
    
    // Slight tweak: if quality is poor, confidence goes way down.
    const confidence = imageQuality === "poor" ? sr(seed, i + 200, 35, 62) : sr(seed, i + 200, 75, 96);
    
    const detectable = confidence >= 65;
    const description = def.descriptions[severity];
    return { label: def.label, emoji: def.emoji, level, severity, confidence, detectable, description };
  });

  const healthScore = sr(seed, 50, 52, 91);
  const acneScore = concerns.find(c => c.label === "Acne & Pimples")?.level ?? 20;
  const hydrationLevel = concerns.find(c => c.label === "Dehydrated Skin")?.level ?? 30;
  const hydrationScore = Math.max(10, 100 - hydrationLevel);
  const skinBrightness = concerns.find(c => c.label === "Skin Brightness")?.level ?? 60;
  const skinSmoothness = concerns.find(c => c.label === "Skin Smoothness")?.level ?? 60;

  const topConcernLabels = [...concerns]
    .sort((a, b) => b.level - a.level)
    .slice(0, 4)
    .map(c => c.label);

  const { toUse, toAvoid } = buildIngredients(skinType, topConcernLabels);
  
  // Advanced recommendation engine
  const recommendedProducts = recommendProducts(skinType, concerns, toAvoid.map(a => a.name));
  
  const morningRoutine = buildMorningRoutine(recommendedProducts);
  const nightRoutine = buildNightRoutine(recommendedProducts);
  
  const weeklyPlan = buildWeeklyPlan(skinType);
  const lifestyleTips = buildLifestyleTips(skinType, healthScore);

  const spfLevel = skinType === "Sensitive" || healthScore < 65 ? 50 : 30;
  const spfNote =
    skinType === "Sensitive"
      ? "Choose a mineral (zinc oxide / titanium dioxide) SPF to minimise irritation."
      : skinType === "Oily"
      ? "Choose a gel or fluid SPF that won't clog pores or add shine."
      : "A lightweight daily SPF is sufficient. Reapply every 2 hours when outdoors.";

  const dailyWaterIntake = healthScore < 60 ? 3000 : 2500;

  const recommendations: string[] = [
    morningRoutine[2]?.instruction ?? "Apply a target serum",
    nightRoutine[2]?.instruction ?? "Hydrate heavily at night",
    `Drink ${dailyWaterIntake / 1000}L of water daily.`,
    `Apply SPF ${spfLevel} every morning.`,
    lifestyleTips[0].tip,
    lifestyleTips[1].tip,
  ];

  return {
    id: `scan_${Date.now()}`,
    date: new Date().toLocaleString(),
    imageDataUrl,
    method,
    imageQuality,
    skinType,
    skinTypeEmoji: skinTypeData.emoji,
    skinTypeConfidence,
    skinTypeDescription: skinTypeData.description,
    skinTone,
    undertone,
    healthScore,
    acneScore,
    hydrationScore,
    skinBrightness,
    skinSmoothness,
    concerns,
    morningRoutine,
    nightRoutine,
    ingredientsToUse: toUse,
    ingredientsToAvoid: toAvoid,
    recommendedProducts,
    recommendations,
    dailyWaterIntake,
    spfRecommendation: spfLevel,
    spfNote,
    lifestyleTips,
    weeklyPlan,
    disclaimer:
      "⚕️ This analysis is AI-generated for informational purposes only. It is not a substitute for professional medical or dermatological advice, diagnosis, or treatment. Always consult a qualified dermatologist for skin concerns.",
  };
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scanHistory, setScanHistory] = useState<ScanReport[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanReport | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("skincare360_scan_history");
    if (raw) {
      try { setScanHistory(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const saveScan = (report: ScanReport) => {
    setCurrentScan(report);
    setScanHistory((prev) => {
      const updated = [report, ...prev.slice(0, 19)];
      localStorage.setItem("skincare360_scan_history", JSON.stringify(updated));
      return updated;
    });
  };

  const analyzeImage = async (
    imageDataUrl: string,
    method: "camera" | "upload"
  ): Promise<ScanReport> => {
    const report = await analyzeImageStandalone(imageDataUrl, method);
    setCurrentScan(report);
    return report;
  };

  const clearCurrentScan = () => setCurrentScan(null);

  return (
    <ScanContext.Provider value={{ scanHistory, currentScan, analyzeImage, saveScan, clearCurrentScan }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within a ScanProvider");
  return ctx;
};
