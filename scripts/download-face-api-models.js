import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, "../public/models");

// Define model URLs - using a specific version known to work
const MODEL_URLS = {
  "tiny_face_detector_model-weights_manifest.json":
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1":
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1",
};

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// Download function with error handling and retries
const downloadFile = (url, filePath, retries = 3) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", async (err) => {
      fs.unlink(filePath, () => {});
      if (retries > 0) {
        console.log(
          `Retrying download for ${filePath}. Attempts remaining: ${
            retries - 1
          }`
        );
        try {
          await downloadFile(url, filePath, retries - 1);
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        reject(err);
      }
    });

    file.on("error", (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
};

// Download all models
const downloadModels = async () => {
  for (const [filename, url] of Object.entries(MODEL_URLS)) {
    const filePath = path.join(MODELS_DIR, filename);
    console.log(`Downloading ${filename}...`);
    try {
      await downloadFile(url, filePath);
      console.log(`Successfully downloaded ${filename}`);
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      process.exit(1);
    }
  }
};

downloadModels();
