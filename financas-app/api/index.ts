import "dotenv/config";
import { createApiApp } from "../server/app";

// Vercel auto-detects this file as a serverless function (no vercel.json
// "functions"/"runtime" config needed). The Express app itself is a valid
// (req, res) => void handler, so we just export it directly.
export default createApiApp();
