import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ASSETS_DIR = join(import.meta.dir, "..", "assets");
const BG_COLOR = "#0172ad";
const SYMBOL_COLOR = "#FFFFFF";

mkdirSync(ASSETS_DIR, { recursive: true });

// Geometric operator builders (no fonts)
function plusSymbol(cx: number, cy: number, size: number): string {
	const half = size / 2;
	const t = size * 0.13;
	return `
		<rect x="${cx - t}" y="${cy - half}" width="${t * 2}" height="${size}" rx="${t}" fill="${SYMBOL_COLOR}" />
		<rect x="${cx - half}" y="${cy - t}" width="${size}" height="${t * 2}" rx="${t}" fill="${SYMBOL_COLOR}" />
	`;
}

function minusSymbol(cx: number, cy: number, size: number): string {
	const barW = size * 0.8;
	const barH = size * 0.22;
	return `
		<rect x="${cx - barW / 2}" y="${cy - barH / 2}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${SYMBOL_COLOR}" />
	`;
}

function equalsSymbol(cx: number, cy: number, size: number): string {
	const barW = size * 0.8;
	const barH = size * 0.18;
	const gap = size * 0.18;
	return `
		<rect x="${cx - barW / 2}" y="${cy - gap - barH / 2}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${SYMBOL_COLOR}" />
		<rect x="${cx - barW / 2}" y="${cy + gap - barH / 2}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${SYMBOL_COLOR}" />
	`;
}

// SVG text element for a digit — librsvg handles system fonts reliably
function digitText(
	cx: number,
	cy: number,
	digit: string,
	size: number,
): string {
	return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="monospace, sans-serif" font-size="${size}" font-weight="bold" fill="${SYMBOL_COLOR}">${digit}</text>`;
}

// 3×3 grid:
//   3  7  +
//   2  4  −
//   5  1  =
//
// Reads like two stacked vertical addition/subtraction problems:
//   37 + 24 = 51  (conceptually — long arithmetic)
function buildIconSvg(canvasSize: number, withBackground: boolean): string {
	const pad = canvasSize * 0.01125;
	const available = canvasSize - 2 * pad;
	const cell = available / 3;

	const cx = (col: number) => pad + cell * col + cell / 2;
	const cy = (row: number) => pad + cell * row + cell / 2;

	const numSize = Math.round(cell * 0.85);
	const opSize = Math.round(cell * 0.62);

	const roundedBg = canvasSize * 0.15;
	const bg = withBackground
		? `<rect width="${canvasSize}" height="${canvasSize}" rx="${roundedBg}" fill="${BG_COLOR}" />`
		: "";

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
	${bg}
	${digitText(cx(0), cy(0), "3", numSize)}
	${digitText(cx(1), cy(0), "7", numSize)}
	${plusSymbol(cx(2), cy(0), opSize)}
	${digitText(cx(0), cy(1), "2", numSize)}
	${digitText(cx(1), cy(1), "4", numSize)}
	${minusSymbol(cx(2), cy(1), opSize)}
	${digitText(cx(0), cy(2), "5", numSize)}
	${digitText(cx(1), cy(2), "1", numSize)}
	${equalsSymbol(cx(2), cy(2), opSize)}
</svg>`;
}

// Adaptive icon: same grid within center 66% safe zone, transparent background
function buildAdaptiveSvg(): string {
	const canvasSize = 1024;
	const safeSize = Math.round(canvasSize * 0.66);
	const offset = (canvasSize - safeSize) / 2;

	const pad = safeSize * 0.01125;
	const available = safeSize - 2 * pad;
	const cell = available / 3;

	const cx = (col: number) => offset + pad + cell * col + cell / 2;
	const cy = (row: number) => offset + pad + cell * row + cell / 2;

	const numSize = Math.round(cell * 0.85);
	const opSize = Math.round(cell * 0.62);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
	${digitText(cx(0), cy(0), "3", numSize)}
	${digitText(cx(1), cy(0), "7", numSize)}
	${plusSymbol(cx(2), cy(0), opSize)}
	${digitText(cx(0), cy(1), "2", numSize)}
	${digitText(cx(1), cy(1), "4", numSize)}
	${minusSymbol(cx(2), cy(1), opSize)}
	${digitText(cx(0), cy(2), "5", numSize)}
	${digitText(cx(1), cy(2), "1", numSize)}
	${equalsSymbol(cx(2), cy(2), opSize)}
</svg>`;
}

interface IconSpec {
	filename: string;
	size: number;
	svg: string;
}

const icons: IconSpec[] = [
	{ filename: "icon.png", size: 1024, svg: buildIconSvg(1024, true) },
	{ filename: "icon-512.png", size: 512, svg: buildIconSvg(1024, true) },
	{ filename: "icon-192.png", size: 192, svg: buildIconSvg(1024, true) },
	{ filename: "adaptive-icon.png", size: 1024, svg: buildAdaptiveSvg() },
	{ filename: "splash-icon.png", size: 1024, svg: buildAdaptiveSvg() },
	{ filename: "favicon.png", size: 48, svg: buildIconSvg(48, true) },
];

async function generate() {
	for (const icon of icons) {
		const outputPath = join(ASSETS_DIR, icon.filename);
		const svgBuffer = Buffer.from(icon.svg);
		await sharp(svgBuffer)
			.resize(icon.size, icon.size)
			.png()
			.toFile(outputPath);
		console.log(`Generated ${icon.filename} (${icon.size}×${icon.size})`);
	}
}

generate().catch((err) => {
	console.error("Failed to generate icons:", err);
	process.exit(1);
});
