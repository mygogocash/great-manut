/**
 * Pick a readable text color (black or white) for text placed on top of an
 * arbitrary solid background color, using the WCAG relative-luminance formula.
 * Used for chips/bars whose fill is a user-chosen palette color, so the label
 * stays legible on both light and dark swatches regardless of the app theme.
 * Falls back to white for unparseable input.
 */
export function readableForeground(background: string): "#ffffff" | "#000000" {
  const rgb = parseHex(background);
  if (!rgb) return "#ffffff";
  const [r, g, b] = rgb.map((c) => {
    const channel = c / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#000000" : "#ffffff";
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = Number.parseInt(match[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
