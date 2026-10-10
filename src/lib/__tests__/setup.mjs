import { LocalStorage } from "node-localstorage";
const path = "/tmp/tulip-ls";
try {
  const fs = await import("node:fs");
  if (fs.existsSync(path)) fs.rmSync(path, { recursive: true });
} catch {
  // ignore
}
globalThis.localStorage = new LocalStorage(path);