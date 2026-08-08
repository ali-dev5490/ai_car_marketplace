import '../server/loadEnv';
import { createApp } from '../server/createApp';

const app = createApp({ serveLocalData: false });

export default app;
