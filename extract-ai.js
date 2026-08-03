import fs from 'fs';
import path from 'path';

const srcFile = path.resolve('src/lib/scan-context.tsx');
const destFile = path.resolve('../Skincare-backend/aiEngine.js');

const code = fs.readFileSync(srcFile, 'utf8');

// Find the start and end of the AI logic
const startToken = "// ─── SEEDED RNG ───────────────────────────────────────────────────────────────";
const endToken = "// ─── PROVIDER ─────────────────────────────────────────────────────────────────";

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end token");
    process.exit(1);
}

const aiCode = code.substring(startIndex, endIndex);

let jsCode = aiCode;
// Remove TS type annotations. This is a very rough approach but for simple constants and functions it works.
jsCode = jsCode.replace(/:\s*string\[\]/g, "");
jsCode = jsCode.replace(/:\s*string/g, "");
jsCode = jsCode.replace(/:\s*number\[\]/g, "");
jsCode = jsCode.replace(/:\s*number/g, "");
jsCode = jsCode.replace(/:\s*boolean/g, "");
jsCode = jsCode.replace(/:\s*SkinConcern\[\]/g, "");
jsCode = jsCode.replace(/:\s*RoutineStep\[\]/g, "");
jsCode = jsCode.replace(/:\s*RecommendedProduct\[\]/g, "");
jsCode = jsCode.replace(/:\s*WeeklyDay\[\]/g, "");
jsCode = jsCode.replace(/:\s*ScanReport/g, "");
jsCode = jsCode.replace(/:\s*ConcernDef\[\]/g, "");
jsCode = jsCode.replace(/:\s*CatalogProduct\[\]/g, "");
jsCode = jsCode.replace(/:\s*\{[^}]*\}/g, "");
jsCode = jsCode.replace(/<[^>]+>/g, ""); // Remove generic types <ScanReport> etc
jsCode = jsCode.replace(/interface\s+\w+\s*{[^}]*}/g, ""); // Remove interfaces
// specifically for analyzeImageStandalone
jsCode = jsCode.replace(/export async function analyzeImageStandalone\(\s*imageDataUrl,\s*method\s*\)\s*\{/, "export async function analyzeImageStandalone(imageDataUrl, method) {");
jsCode = jsCode.replace(/:\s*"camera"\s*\|\s*"upload"/g, "");

// Write to aiEngine.js
fs.writeFileSync(destFile, jsCode);
console.log("Successfully extracted AI logic to", destFile);

// Now, remove the AI logic from scan-context.tsx
const newContextCode = code.substring(0, startIndex) + code.substring(endIndex);
fs.writeFileSync(srcFile, newContextCode);
console.log("Removed AI logic from scan-context.tsx");
