// E2E testlerini yalıtılmış ortamda çalıştırır (bkz. e2e.mjs başındaki not).
//
//   npm run test:e2e
//
// Yaptıkları: geçici boş veri klasörü + kendi test yöneticisi + boş port +
// ayrı derleme klasörü ile yeni bir `next dev` başlatır, testi çalıştırır,
// sonra sunucuyu kapatıp geçici klasörü siler. Gerçek `data/` ve `.env.local`
// kullanılmaz (süreç ortam değişkenleri .env.local'ı ezer).
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// lib/server/password.ts ile aynı biçim ve parametreler.
function hashPassword(password) {
  const N = 32768, r = 8, p = 1;
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFKC"), salt, 32, { N, r, p, maxmem: 256 * N * r });
  return `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// `next dev`, distDir için tsconfig.json'u yeniden yazar; çalıştırma bitince eski haline döndürürüz.
const tsconfigFile = path.join(root, "tsconfig.json");
const tsconfigBackup = readFileSync(tsconfigFile);

const port = await freePort();
const dataDir = mkdtempSync(path.join(tmpdir(), "ayrac-e2e-"));
const adminUser = "e2e-yonetici";
const adminPass = randomBytes(18).toString("base64url");
const base = `http://localhost:${port}`;

const env = {
  ...process.env,
  AYRAC_DATA_DIR: dataDir,
  AYRAC_DIST_DIR: ".next-e2e",
  ADMIN_USERNAME: adminUser,
  ADMIN_PASSWORD_HASH: hashPassword(adminPass),
  ADMIN_TEST_USER: adminUser,
  ADMIN_TEST_PASS: adminPass,
  BASE_URL: base,
  E2E_ISOLATED: "1",
  NEXT_TELEMETRY_DISABLED: "1",
};

const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "-p", String(port)], {
  cwd: root,
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

function stopServer() {
  if (server.exitCode !== null || !server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill("SIGKILL");
}

function cleanup() {
  stopServer();
  try { writeFileSync(tsconfigFile, tsconfigBackup); } catch {}
  // Windows'ta dosya kilidi birkaç saniye sürebilir; başarısız olursa işletim sistemi temp'i temizler.
  try { rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
}

let code = 1;
try {
  let ready = false;
  for (let i = 0; i < 120 && !ready; i++) {
    if (server.exitCode !== null) break;
    try { ready = (await fetch(base, { redirect: "manual" })).status < 500; } catch {}
    if (!ready) await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) {
    console.error("Test sunucusu açılamadı:\n" + serverLog.slice(-2000));
  } else {
    console.log(`Yalıtılmış test sunucusu: ${base} (geçici veri: ${dataDir})`);
    const t = spawnSync(process.execPath, [path.join(root, "tests/e2e.mjs")], { cwd: root, env, stdio: "inherit" });
    code = t.status ?? 1;
  }
} finally {
  cleanup();
}
process.exit(code);
