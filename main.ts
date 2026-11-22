// Tide Market's hand-in program (Node 22, standard library only).
//
// The game lives in this repository's game/ folder: plain static files that
// a desktop browser loads offline — game/index.html plus its ES modules,
// no library, no network request. This program copies game/ and
// screenshots/ from beside this file into the output directory and writes
// output/dossier.json, the summary the judge reads, using the vendored
// make.fun library (vendor/makefun-game.ts).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p /tmp/tm-out && MAKEFUN_OUTPUT_DIR=/tmp/tm-out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader caps the whole of /output at 1,000 entries and 64 MiB, and the
// gate caps game/ itself at 993 entries / 48 MiB and each screenshot at
// 256 KiB, so pass those caps through: the program then refuses exactly
// where the scorer would refuse, instead of handing in a broken entry.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), {
    recursive: true,
  });
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, dossierCaps),
);

// A silent partial copy must never be handed in: confirm the three things
// the gate reads are all there, and that the dossier is the one the
// library just wrote (a stale or hand-edited dossier fails the gate).
for (const needed of ['game/index.html', 'screenshots', 'dossier.json']) {
  if (!existsSync(join(outputDir, needed))) {
    throw new Error(`main.ts: output is missing ${needed}`);
  }
}
const dossier = JSON.parse(readFileSync(join(outputDir, 'dossier.json'), 'utf8'));
if (dossier.schema !== 'makefun/dossier/v1') {
  throw new Error('main.ts: dossier.json is not a makefun/dossier/v1 dossier');
}
