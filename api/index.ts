import { createApp } from '../server/createApp.js';

// Vercel injects GEMINI_API_KEY into process.env — no dotenv needed here.
export default createApp({ serveLocalData: false });
