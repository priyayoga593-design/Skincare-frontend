import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  try {
    // Use the CDN for the models to avoid needing to bundle them
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  } catch (error) {
    console.error("Failed to load face-api models:", error);
    // If we fail to load, we don't want to completely block the user, 
    // but ideally models should load fine.
  }
}

// Helper to check image blurriness using variance of Laplacian
function checkBlurriness(image: HTMLImageElement): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const idx = (i * width + j) * 4;
      gray[i * width + j] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }

  // Laplacian kernel
  const kernel = [
    0, 1, 0,
    1, -4, 1,
    0, 1, 0
  ];

  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let count = 0;

  for (let i = 1; i < height - 1; i++) {
    for (let j = 1; j < width - 1; j++) {
      let sum = 0;
      sum += gray[(i - 1) * width + j] * kernel[1]; // top
      sum += gray[i * width + (j - 1)] * kernel[3]; // left
      sum += gray[i * width + j] * kernel[4];       // center
      sum += gray[i * width + (j + 1)] * kernel[5]; // right
      sum += gray[(i + 1) * width + j] * kernel[7]; // bottom

      laplacianSum += sum;
      laplacianSqSum += sum * sum;
      count++;
    }
  }

  const mean = laplacianSum / count;
  const variance = (laplacianSqSum / count) - (mean * mean);

  // Magic threshold for blurriness (can be tuned)
  // Very low variance = blurry. High variance = sharp.
  // 50 is a reasonable baseline for typical selfies.
  return variance < 50; 
}

export async function validateImage(dataUrl: string): Promise<{ valid: boolean, error?: string, isPoorQuality?: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = async () => {
      try {
        // 1. Check Blur
        const isBlurry = checkBlurriness(img);
        
        // 2. Load Models
        await loadFaceApiModels();
        if (!modelsLoaded) {
          // If models failed to load, just accept the image but flag as poor quality if blurry
          return resolve({ valid: true, isPoorQuality: isBlurry });
        }

        // 3. Detect Faces
        const detections = await faceapi.detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
        );

        if (detections.length === 0) {
          return resolve({ valid: false, error: "No face detected. Please ensure your face is clearly visible and well-lit." });
        }
        
        if (detections.length > 1) {
          return resolve({ valid: false, error: "Multiple faces detected. Please ensure only you are in the frame." });
        }

        // Face is valid. Check quality.
        if (isBlurry) {
          return resolve({ valid: true, isPoorQuality: true });
        }

        resolve({ valid: true });
      } catch (err) {
        console.error("Validation error:", err);
        // Fallback on error so we don't completely block the user
        resolve({ valid: true, isPoorQuality: true });
      }
    };
    img.onerror = () => {
      resolve({ valid: false, error: "Failed to read image data." });
    };
    img.src = dataUrl;
  });
}
