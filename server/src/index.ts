import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const port = Number(process.env.PORT) || 5000;

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${port}`);
});
