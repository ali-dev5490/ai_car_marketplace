/**
 * Vercel serverless entry — bundled to api/index.cjs as CommonJS
 * so Node does not need ESM extension resolution.
 */
import { createApp } from '../server/createApp';

export default createApp({ serveLocalData: false });
