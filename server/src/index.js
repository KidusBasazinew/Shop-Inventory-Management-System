import { createServer } from "node:http";

import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();
const server = createServer(app);

server.listen(env.port, () => {
  console.info(`API listening on http://192.168.8.11:${env.port}`);
});
