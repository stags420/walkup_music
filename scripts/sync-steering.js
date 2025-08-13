#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function ensureDirectoryExists(directoryPath) {
  await fsp.mkdir(directoryPath, { recursive: true });
}

function splitFrontmatterIfPresent(fileContent) {
  const trimmed = fileContent.startsWith('\uFEFF') ? fileContent.slice(1) : fileContent;
  if (!trimmed.startsWith('---')) {
    return { frontmatter: null, body: fileContent };
  }
  const lines = trimmed.split(/\r?\n/);
  let endIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      endIndex = index;
      break;
    }
  }
  if (endIndex === -1) {
    return { frontmatter: null, body: fileContent };
  }
  const body = lines.slice(endIndex + 1).join('\n');
  return { frontmatter: lines.slice(0, endIndex + 1).join('\n'), body };
}

function buildCursorRulesContent(body) {
  const fm = ['---', 'alwaysApply: true', '---', ''].join('\n');
  return fm + body.replace(/^\n+/, '');
}

function buildKiroSteeringContent(body) {
  const fm = ['---', 'inclusion: always', '---', ''].join('\n');
  return fm + body.replace(/^\n+/, '');
}

async function* walk(dir, baseDir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      yield* walk(fullPath, baseDir);
    } else if (entry.isFile()) {
      yield { fullPath, relativePath };
    }
  }
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const steeringDir = __dirname;
  const cursorRulesDir = path.resolve(steeringDir, '../.cursor/rules');
  const kiroSteeringDir = path.resolve(steeringDir, '../.kiro/steering');

  console.log(`[sync-steering] Source: ${steeringDir}`);
  console.log(`[sync-steering] Target (Cursor rules): ${cursorRulesDir}`);
  console.log(`[sync-steering] Target (Kiro steering): ${kiroSteeringDir}`);

  let processedCount = 0;

  for await (const { fullPath, relativePath } of walk(steeringDir, steeringDir)) {
    // Skip this script itself
    if (path.resolve(fullPath) === path.resolve(__filename)) continue;

    // Only process markdown files
    if (path.extname(relativePath).toLowerCase() !== '.md') continue;

    const sourceContent = await fsp.readFile(fullPath, 'utf8');
    const { body } = splitFrontmatterIfPresent(sourceContent);

    // Write to Cursor rules
    const cursorOutPath = path.join(cursorRulesDir, relativePath);
    await ensureDirectoryExists(path.dirname(cursorOutPath));
    await fsp.writeFile(cursorOutPath, buildCursorRulesContent(body), 'utf8');

    // Write to Kiro steering
    const kiroOutPath = path.join(kiroSteeringDir, relativePath);
    await ensureDirectoryExists(path.dirname(kiroOutPath));
    await fsp.writeFile(kiroOutPath, buildKiroSteeringContent(body), 'utf8');

    processedCount += 1;
    console.log(`[sync-steering] Synced: ${relativePath}`);
  }

  console.log(`[sync-steering] Completed. Files processed: ${processedCount}`);
}

main().catch((error) => {
  console.error('[sync-steering] Failed:', error);
  process.exitCode = 1;
});


