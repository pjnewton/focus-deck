# Focus Deck

A local-only flashcard study app for a bundled three-row foldable printable ACAMS flashcard PDF.

Place the production PDF at `ACAMS-Flashcards-Printable-v7.02.pdf` or `public/acams-flashcards.pdf` before building locally. Both PDF paths are ignored by Git.

For Netlify Git deploys, set one of these environment variables so the build can recreate `public/acams-flashcards.pdf` without committing the PDF:

- `ACAMS_FLASHCARDS_PDF_URL`: direct HTTPS URL to the PDF
- `ACAMS_FLASHCARDS_PDF_TOKEN`: optional bearer token for the PDF URL
- `ACAMS_FLASHCARDS_PDF_BASE64`: base64-encoded PDF contents
- `ACAMS_FLASHCARDS_PDF_PATH`: path to a PDF already available in the build environment

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), load the ACAMS deck, and start a focus sprint. The PDF is served as a static app asset, parsed in your browser, and your deck progress stays in local storage.

The PDF parser expects three front/back card rows per page, with the fronts on the left and the answers on the right.

## Maintenance

The `postcss` override keeps Next's transitive PostCSS dependency on the patched `8.5.x` line until Next includes that update directly.
