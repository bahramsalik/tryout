/**
 * Zip building and inspection. Zips are only ever read in memory (adm-zip from a Buffer);
 * nothing is extracted to disk (SPEC §7.7).
 */
import AdmZip from 'adm-zip';
import type { AutoCheck, ChallengeType, FilePreview, StarterFile } from '../../shared/types.ts';
import { PREVIEW_MAX_BYTES, README_MAX_BYTES, TREE_MAX_PATHS } from './config.ts';
import { HttpError } from './errors.ts';

export function buildZip(files: StarterFile[]): Buffer {
  const zip = new AdmZip();
  for (const f of files) zip.addFile(f.path.replace(/^\/+/, ''), Buffer.from(f.content, 'utf8'));
  return zip.toBuffer();
}

/** Extension + `PK` magic bytes (SPEC §5.5 #5). */
export function looksLikeZip(name: string, buf: Buffer): { extOk: boolean; magicOk: boolean } {
  return {
    extOk: /\.zip$/i.test(name),
    magicOk: buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b,
  };
}

const isHidden = (p: string) => p.startsWith('__MACOSX/') || p.split('/').some((seg) => seg.startsWith('.'));

export interface ZipInspection {
  fileCount: number;
  tree: string[];
  readme: string | null;
  totalUncompressedBytes: number;
}

/** Throws when the buffer is not a readable zip. */
export function inspectZip(buf: Buffer): ZipInspection {
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const files = entries
    .filter((e) => !e.isDirectory)
    .map((e) => ({ entry: e, path: e.entryName.replace(/\\/g, '/').replace(/^\.\//, '') }))
    .filter((f) => !isHidden(f.path));
  files.sort((a, b) => a.path.localeCompare(b.path));

  const readmeCandidates = files
    .filter((f) => /^readme(\.[a-z0-9]+)?$/i.test(f.path.split('/').pop() ?? ''))
    .sort((a, b) => {
      const depth = a.path.split('/').length - b.path.split('/').length;
      if (depth !== 0) return depth;
      const md = Number(/\.md$/i.test(b.path)) - Number(/\.md$/i.test(a.path));
      return md !== 0 ? md : a.path.localeCompare(b.path);
    });

  let readme: string | null = null;
  const first = readmeCandidates[0];
  // Only decompress READMEs of sane size (zip-bomb guard), then cap at 20 KB.
  if (first && first.entry.header.size <= 2 * 1024 * 1024) {
    readme = first.entry.getData().subarray(0, README_MAX_BYTES).toString('utf8');
  }

  return {
    fileCount: files.length,
    tree: files.slice(0, TREE_MAX_PATHS).map((f) => f.path),
    readme,
    totalUncompressedBytes: files.reduce((sum, f) => sum + (f.entry.header.size || 0), 0),
  };
}

const TEST_PATH = /(^|\/)(tests?|__tests__|spec|specs)\/|\.(test|spec)\.[a-z0-9]+$|(^|\/)test_[^/]+\.py$|_test\.(go|py)$/i;
const SETUP_HINT =
  /(^|\n)#+\s*(setup|set up|getting started|install(ation)?|how to run|running|run it|usage|quick ?start)\b|npm (install|i|run|test)|pnpm |yarn |pip install|python -m|poetry |make |docker |go run|cargo run|jupyter/i;
const ANALYSIS_PATH = /\.(ipynb|sql|py|r|rmd|jl)$/i;
const DELIVERABLE_PATH = /\.(pdf|md|docx?|pptx?|key|xlsx?|csv|fig|sketch|png|jpe?g|svg|html|txt)$/i;

/** Cheap, honest signals shown next to each submission (SPEC §7.7). */
export function computeAutoChecks(type: ChallengeType, z: Pick<ZipInspection, 'tree' | 'readme' | 'fileCount'>, sizeBytes: number): AutoCheck[] {
  const checks: AutoCheck[] = [{ label: 'README included', passed: z.readme !== null }];
  const nonReadme = z.tree.filter((p) => !/^readme(\.[a-z0-9]+)?$/i.test(p.split('/').pop() ?? ''));
  if (type === 'software') {
    checks.push({ label: 'Tests detected', passed: z.tree.some((p) => TEST_PATH.test(p)) });
    checks.push({ label: 'Setup instructions found', passed: !!z.readme && SETUP_HINT.test(z.readme) });
  } else if (type === 'data') {
    checks.push({ label: 'Analysis code or notebook included', passed: z.tree.some((p) => ANALYSIS_PATH.test(p)) });
    checks.push({ label: 'Setup instructions found', passed: !!z.readme && SETUP_HINT.test(z.readme) });
  } else {
    checks.push({ label: 'Deliverable files included', passed: nonReadme.some((p) => DELIVERABLE_PATH.test(p)) });
  }
  checks.push({ label: 'Reasonable size (< 25 MB)', passed: sizeBytes < 25 * 1024 * 1024 && z.fileCount <= 500 });
  return checks;
}

/** Text preview of one file inside a zip (≤ 100 KB, truncated beyond). */
export function previewZipFile(buf: Buffer, requestedPath: string): FilePreview {
  const wanted = requestedPath.replace(/\\/g, '/').replace(/^\.?\/+/, '');
  if (!wanted) throw new HttpError(400, 'PATH_REQUIRED', 'Pass ?path=<file inside the zip>.');
  const zip = new AdmZip(buf);
  const entry = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').replace(/^\.\//, '') === wanted);
  if (!entry || entry.isDirectory) throw new HttpError(404, 'FILE_NOT_FOUND', `No file "${wanted}" in this submission.`);
  if (entry.header.size > 5 * 1024 * 1024) {
    throw new HttpError(413, 'PREVIEW_TOO_LARGE', 'That file is too large to preview. Download the zip instead.');
  }
  const data = entry.getData();
  const head = data.subarray(0, Math.min(data.length, 8000));
  if (head.includes(0)) throw new HttpError(415, 'NOT_TEXT', 'That file is binary and cannot be previewed.');
  return {
    path: wanted,
    content: data.subarray(0, PREVIEW_MAX_BYTES).toString('utf8'),
    truncated: data.length > PREVIEW_MAX_BYTES,
  };
}
