/**
 * Generate JPG thumbnails for every .mp4 video in known asset folders.
 * Skips videos that already have a matching .jpg next to them.
 *
 * Run via `npm run generate-thumbnails` (also wired as `prebuild`).
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const VIDEO_DIRS = [
  path.join(PROJECT_ROOT, "public", "video-production"),
  path.join(PROJECT_ROOT, "public", "vfx"),
];

/** Resolve `ffmpeg` from PATH, falling back to the known winget install path. */
function resolveFfmpeg() {
  const wingetGuess = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft",
    "WinGet",
    "Packages",
  );
  if (existsSync(wingetGuess)) {
    let pkgs = [];
    try {
      pkgs = readdirSync(wingetGuess).filter((d) => d.startsWith("Gyan.FFmpeg"));
    } catch {
      pkgs = [];
    }
    for (const pkg of pkgs) {
      const pkgRoot = path.join(wingetGuess, pkg);
      try {
        const builds = readdirSync(pkgRoot);
        for (const build of builds) {
          const candidate = path.join(pkgRoot, build, "bin", "ffmpeg.exe");
          if (existsSync(candidate)) return candidate;
        }
      } catch {
        // ignore
      }
    }
  }
  return "ffmpeg";
}

const FFMPEG = resolveFfmpeg();

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}\n${stderr}`));
    });
  });
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function processDir(dir) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`  (skip) directory missing: ${dir}`);
      return { generated: 0, skipped: 0 };
    }
    throw err;
  }

  const videos = entries.filter((f) => f.toLowerCase().endsWith(".mp4"));
  let generated = 0;
  let skipped = 0;

  for (const video of videos) {
    const videoPath = path.join(dir, video);
    const baseName = video.replace(/\.mp4$/i, "");
    const thumbPath = path.join(dir, `${baseName}.jpg`);

    if (await fileExists(thumbPath)) {
      console.log(`  ✓ skip (exists) ${path.relative(PROJECT_ROOT, thumbPath)}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  → generating ${path.relative(PROJECT_ROOT, thumbPath)} ... `);
    try {
      await runFfmpeg([
        "-y",
        "-i", videoPath,
        "-ss", "00:00:01.5",
        "-vframes", "1",
        "-q:v", "2",
        "-vf", "scale=720:-2",
        thumbPath,
      ]);
      console.log("done");
      generated++;
    } catch (err) {
      console.log(`failed\n    ${err.message.split("\n")[0]}`);
    }
  }

  return { generated, skipped };
}

async function main() {
  console.log(`Using ffmpeg: ${FFMPEG}`);
  console.log("");

  let totalGenerated = 0;
  let totalSkipped = 0;
  for (const dir of VIDEO_DIRS) {
    console.log(path.relative(PROJECT_ROOT, dir));
    const { generated, skipped } = await processDir(dir);
    totalGenerated += generated;
    totalSkipped += skipped;
    console.log("");
  }

  console.log(`Done — ${totalGenerated} generated, ${totalSkipped} already present.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
