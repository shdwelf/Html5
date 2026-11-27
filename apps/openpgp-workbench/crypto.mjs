import * as openpgp from "openpgp";
import { createOpenPgpTextTools } from "./text-tools.mjs";
export * from "./text-tools.mjs";

const tools = createOpenPgpTextTools(openpgp);
export const CLASSIC_OPENPGP_CONFIG = tools.config;
export const encryptClassicText = tools.encryptClassicText;
export const decryptOpenPgpText = tools.decryptOpenPgpText;
export const decryptOpenPgpBytes = tools.decryptOpenPgpBytes;
