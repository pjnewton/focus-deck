import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const targetPath = resolve('public/acams-flashcards.pdf');
const localSourcePath = resolve('ACAMS-Flashcards-Printable-v7.02.pdf');
const envSourcePath = process.env.ACAMS_FLASHCARDS_PDF_PATH
  ? resolve(process.env.ACAMS_FLASHCARDS_PDF_PATH)
  : '';
const envBase64 = process.env.ACAMS_FLASHCARDS_PDF_BASE64;
const envUrl = process.env.ACAMS_FLASHCARDS_PDF_URL;
const envToken = process.env.ACAMS_FLASHCARDS_PDF_TOKEN;

function describeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return 'invalid URL';
  }
}

async function downloadPdf(url) {
  const response = await fetch(url, {
    headers: envToken ? { Authorization: `Bearer ${envToken}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download bundled ACAMS PDF from ${describeUrl(url)}: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
    console.warn(`Downloaded PDF has unexpected content type: ${contentType}`);
  }

  writeFileSync(targetPath, Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded bundled ACAMS PDF from ACAMS_FLASHCARDS_PDF_URL`);
}

mkdirSync(dirname(targetPath), { recursive: true });

if (existsSync(targetPath)) {
  console.log(`Bundled ACAMS PDF already exists at ${targetPath}`);
} else if (envBase64) {
  writeFileSync(targetPath, Buffer.from(envBase64, 'base64'));
  console.log(`Wrote bundled ACAMS PDF from ACAMS_FLASHCARDS_PDF_BASE64`);
} else if (envUrl) {
  await downloadPdf(envUrl);
} else if (envSourcePath && existsSync(envSourcePath)) {
  copyFileSync(envSourcePath, targetPath);
  console.log(`Copied bundled ACAMS PDF from ${envSourcePath}`);
} else if (existsSync(localSourcePath)) {
  copyFileSync(localSourcePath, targetPath);
  console.log(`Copied bundled ACAMS PDF from ignored local root PDF`);
} else {
  const message =
    'Missing bundled ACAMS PDF. Provide public/acams-flashcards.pdf, ACAMS-Flashcards-Printable-v7.02.pdf, ACAMS_FLASHCARDS_PDF_URL, ACAMS_FLASHCARDS_PDF_PATH, or ACAMS_FLASHCARDS_PDF_BASE64.';

  if (process.env.NETLIFY) {
    throw new Error(message);
  }

  console.warn(message);
}
