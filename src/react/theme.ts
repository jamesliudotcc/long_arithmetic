/**
 * Design tokens mirroring Pico.css v2 (light theme defaults).
 * Web uses Pico.css directly; React Native consumes these tokens.
 * Reference: https://picocss.com/docs/css-variables
 */

export const colors = {
	// Brand
	primary: "#0172ad",
	primaryHover: "#015d8e",
	primaryFocus: "rgba(1, 114, 173, 0.25)",

	// Surfaces
	background: "#ffffff",
	surface: "#f9fafb",
	card: "#ffffff",

	// Text
	text: "#373c3f",
	textMuted: "#8892a0",

	// Borders
	border: "#c2c7d0",

	// Semantic
	error: "#c0392b",
	errorSurface: "#fdecea",
	success: "#198754",
	successSurface: "#eaf5ee",
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	"2xl": 48,
} as const;

export const typography = {
	// Font sizes — Pico base is 1rem (16px), scale is fluid but these are sane fixed stops
	fontSize: {
		sm: 14,
		base: 16,
		lg: 20,
		xl: 24,
		"2xl": 32,
		"3xl": 48,
	},
	fontWeight: {
		normal: "400" as const,
		semibold: "600" as const,
		bold: "700" as const,
	},
	lineHeight: {
		tight: 20,
		base: 24,
		relaxed: 32,
	},
} as const;

// 0.375rem = 6px in Pico
export const radius = {
	sm: 4,
	md: 6,
	lg: 12,
	full: 9999,
} as const;

export const theme = {
	colors,
	spacing,
	typography,
	radius,
} as const;

export type Theme = typeof theme;
