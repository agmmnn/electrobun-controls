import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(root, "../dist");
const sourceCss = resolve(root, "../src/style.css");

const files = await readdir(distDir);

async function copyStableEntry(prefix) {
  const stableTypeFile = `${prefix}.d.ts`;

  if (files.includes(stableTypeFile)) {
    return;
  }

  const typeFile = files.find(
    (file) =>
      file.startsWith(`${prefix}-`) &&
      file.endsWith(".d.ts") &&
      !file.endsWith(".d.ts.map"),
  );

  if (!typeFile) {
    throw new Error(`Missing generated type entry for "${prefix}".`);
  }

  await copyFile(
    resolve(distDir, typeFile),
    resolve(distDir, `${prefix}.d.ts`),
  );

  const mapFile = files.find((file) => file === `${typeFile}.map`);
  if (mapFile) {
    await copyFile(
      resolve(distDir, mapFile),
      resolve(distDir, `${prefix}.d.ts.map`),
    );
  }
}

await mkdir(distDir, { recursive: true });
await copyFile(sourceCss, resolve(distDir, "style.css"));
await writeFile(
  resolve(distDir, "style.css.d.ts"),
  "declare const stylesheet: string\nexport default stylesheet\n",
);

await copyStableEntry("index");
await copyStableEntry("dom");
await copyStableEntry("electrobun");
await copyStableEntry("bun");
