const envUrl = process.env.ACAMS_FLASHCARDS_PDF_URL;
const envToken = process.env.ACAMS_FLASHCARDS_PDF_TOKEN;

if (!envUrl) {
  throw new Error('Set ACAMS_FLASHCARDS_PDF_URL before running this check.');
}

const response = await fetch(envUrl, {
  method: 'HEAD',
  headers: envToken ? { Authorization: `Bearer ${envToken}` } : undefined,
});

console.log(`Status: ${response.status} ${response.statusText}`);
console.log(`Content-Type: ${response.headers.get('content-type') ?? '(missing)'}`);
console.log(`Content-Length: ${response.headers.get('content-length') ?? '(missing)'}`);

if (!response.ok) {
  throw new Error('PDF URL is not directly downloadable.');
}
