#!/usr/bin/env node
/**
 * Interactive argon2 password hasher.
 *
 * Usage:  npm run hash-password
 *
 * Type the password (input is hidden), press Enter, copy the hash that
 * prints out, paste it into `.env.local` next to the matching admin
 * (`ADMIN_PASSWORD_HASH_N=...`).
 */
import { hash } from "@node-rs/argon2";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

// Mute echoing so the typed password isn't visible.
const original = rl._writeToOutput?.bind(rl);
let muted = false;
rl._writeToOutput = (str) => {
  if (!muted) original?.(str);
  else original?.("*");
};

rl.question("Password: ", async (password) => {
  rl._writeToOutput = original;
  console.log("");
  if (!password || password.length < 8) {
    console.error("✖  Password must be at least 8 characters.");
    rl.close();
    process.exit(1);
  }
  try {
    const out = await hash(password, {
      // argon2id, parameters per OWASP 2024 cheatsheet baseline.
      memoryCost: 19_456, // 19 MiB
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    // @next/env runs every parsed value through dotenv-expand AFTER
    // quote-stripping, so quotes don't protect the `$` characters.
    // Escape each `$` with a backslash — no quotes needed.
    const escaped = out.replace(/\$/g, "\\$");
    console.log("\nPaste this into .env.local (no surrounding quotes):\n");
    console.log(`ADMIN_PASSWORD_HASH_N=${escaped}`);
    console.log(
      "\n  ⚠️  Each `$` MUST stay backslash-escaped. @next/env's",
    );
    console.log(
      "      dotenv-expand step would otherwise eat them as variable refs.\n",
    );
  } catch (err) {
    console.error("✖  Hashing failed:", err);
    process.exit(1);
  }
  rl.close();
});

muted = true;
