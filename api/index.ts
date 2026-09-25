// Vercel serverless entrypoint. The Express app is exported as the default
// handler; Vercel calls it for every incoming request.
import { app } from '../src/app';

export default app;