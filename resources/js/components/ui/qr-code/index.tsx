"use client";

import { formatHex, oklch } from "culori";
import QR from "qrcode";
import { type HTMLAttributes, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type QRCodeProps = HTMLAttributes<HTMLDivElement> & {
	data: string;
	foreground?: string;
	background?: string;
	robustness?: "L" | "M" | "Q" | "H";
};

const oklchRegex = /oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/;

const getOklch = (color: string, fallback: [number, number, number]) => {
	const oklchMatch = color.match(oklchRegex);

	if (!oklchMatch) {
		return { l: fallback[0], c: fallback[1], h: fallback[2] };
	}

	return {
		l: Number.parseFloat(oklchMatch[1]),
		c: Number.parseFloat(oklchMatch[2]),
		h: Number.parseFloat(oklchMatch[3]),
	};
};

// Fallback colors based on theme
const getFallbackColors = (isDark: boolean) => {
	if (isDark) {
		// Dark mode: white foreground, dark background
		return {
			foreground: "oklch(0.985 0 0)", // white
			background: "oklch(0.145 0 0)", // dark
		};
	}
	// Light mode: dark foreground, white background
	return {
		foreground: "oklch(0.145 0 0)", // dark
		background: "oklch(1 0 0)", // white
	};
};

export const QRCode = ({
	data,
	foreground,
	background,
	robustness = "M",
	className,
	...props
}: QRCodeProps) => {
	const [svg, setSVG] = useState<string | null>(null);
	const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
		if (typeof document === "undefined") {
			return false;
		}
		return document.documentElement.classList.contains("dark");
	});

	// Detect dark mode state changes
	useEffect(() => {
		const checkDarkMode = () => {
			return document.documentElement.classList.contains("dark");
		};

		// Watch for class changes on document.documentElement
		const observer = new MutationObserver(() => {
			setIsDarkMode(checkDarkMode());
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => {
			observer.disconnect();
		};
	}, []);

	useEffect(() => {
		const generateQR = async () => {
			try {
				// Wait a tick to ensure CSS is loaded and dark class is applied
				await new Promise((resolve) => {
					setTimeout(resolve, 0);
				});

				const styles = getComputedStyle(document.documentElement);
				let foregroundColor =
					foreground ?? styles.getPropertyValue("--foreground").trim();
				let backgroundColor =
					background ?? styles.getPropertyValue("--background").trim();

				// Use fallback colors if CSS variables are empty or not loaded
				if (!foregroundColor || !backgroundColor) {
					const fallbacks = getFallbackColors(isDarkMode);
					foregroundColor = foregroundColor || fallbacks.foreground;
					backgroundColor = backgroundColor || fallbacks.background;
				}

				const foregroundOklch = getOklch(
					foregroundColor,
					isDarkMode ? [0.985, 0, 0] : [0.145, 0, 0],
				);
				const backgroundOklch = getOklch(
					backgroundColor,
					isDarkMode ? [0.145, 0, 0] : [0.985, 0, 0],
				);

				const newSvg = await QR.toString(data, {
					type: "svg",
					color: {
						dark: formatHex(oklch({ mode: "oklch", ...foregroundOklch })),
						light: formatHex(oklch({ mode: "oklch", ...backgroundOklch })),
					},
					width: 200,
					errorCorrectionLevel: robustness,
					margin: 0,
				});

				setSVG(newSvg);
			} catch (err) {
				console.error(err);
			}
		};

		generateQR();
	}, [data, foreground, background, robustness, isDarkMode]);

	if (!svg) {
		return null;
	}

	return (
		<div
			className={cn("size-full", "[&_svg]:size-full", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for SVG"
			dangerouslySetInnerHTML={{ __html: svg }}
			{...(props as HTMLAttributes<HTMLDivElement>)}
		/>
	);
};
