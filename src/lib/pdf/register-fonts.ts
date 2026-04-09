import { Font } from "@react-pdf/renderer";

// Register Noto Sans which supports rupee symbol, Unicode chars, and most scripts.
// Using CDN-hosted font files to avoid bundling large files.
// Noto Sans is a Google Font with comprehensive Unicode coverage including:
// - Indian Rupee symbol
// - Latin extended
// - Devanagari (Hindi)
// - Various currency symbols

let fontsRegistered = false;

export function registerPdfFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;

  Font.register({
    family: "NotoSans",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-ext-400-normal.ttf",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-ext-700-normal.ttf",
        fontWeight: 700,
      },
    ],
  });

  // Disable hyphenation to prevent issues with word breaks in PDFs
  Font.registerHyphenationCallback((word) => [word]);
}
