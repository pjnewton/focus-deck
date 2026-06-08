# Focus Deck

A local-only flashcard study app for three-row foldable printable flashcard PDFs.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), choose a supported PDF, and start a focus sprint. The PDF is processed in your browser and your deck progress stays in local storage.

The PDF importer expects three front/back card rows per page, with the fronts on the left and the answers on the right. For other layouts, use the pasted-text importer with `Q:` / `A:` blocks or `question::answer` pairs.

## Maintenance

The `postcss` override keeps Next's transitive PostCSS dependency on the patched `8.5.x` line until Next includes that update directly.
