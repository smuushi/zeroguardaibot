import { cleanEnv, str } from "envalid";
import * as dotenv from "dotenv";

dotenv.config();

export const env = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  NODE_ENV: str({ choices: ["development", "production"] }),
  PRIVATE_KEY: str(),
  PROVIDER_ADDRESS: str(),
  SERVICE_NAME: str(),
});
