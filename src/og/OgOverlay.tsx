/** @jsxRuntime automatic */
/** @jsxImportSource react */

type OgOverlayProps = {
	description: string;
	domain: string;
	lines: string[];
};

const WIDTH = 1200;
const HEIGHT = 630;

export function OgOverlay({ description, domain, lines }: OgOverlayProps) {
	const fontSize = lines.length === 1 ? 74 : lines.length === 2 ? 64 : 56;
	const lineHeight = fontSize + 18;
	const titleBlockHeight = lines.length * lineHeight;
	const contentX = 160;
	const startY = 276;
	const plateX = 144;
	const plateY = startY - fontSize - 54;
	const plateWidth = 860;
	const descriptionY = startY + titleBlockHeight + 60;
	const plateHeight = descriptionY - plateY + 58;
	const footerY = HEIGHT - 38;

	return (
		<svg
			width={WIDTH}
			height={HEIGHT}
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>{lines.join(' / ')}</title>
			<defs>
				<linearGradient
					id="brightWash"
					x1="0"
					y1="0"
					x2={String(WIDTH)}
					y2={String(HEIGHT)}
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0" stopColor="rgba(248, 251, 255, 0.82)" />
					<stop offset="0.52" stopColor="rgba(243, 248, 255, 0.72)" />
					<stop offset="1" stopColor="rgba(239, 246, 255, 0.80)" />
				</linearGradient>
				<radialGradient
					id="blueGlow"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(1020 110) rotate(146) scale(460 300)"
				>
					<stop stopColor="rgba(147, 197, 253, 0.24)" />
					<stop offset="1" stopColor="rgba(147, 197, 253, 0)" />
				</radialGradient>
				<radialGradient
					id="leftGlow"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(220 448) rotate(-12) scale(520 260)"
				>
					<stop stopColor="rgba(59, 130, 246, 0.08)" />
					<stop offset="1" stopColor="rgba(59, 130, 246, 0)" />
				</radialGradient>
				<linearGradient id="textPlate" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="rgba(255, 255, 255, 0.56)" />
					<stop offset="1" stopColor="rgba(255, 255, 255, 0.34)" />
				</linearGradient>
			</defs>

			<rect width={WIDTH} height={HEIGHT} fill="url(#brightWash)" />
			<rect width={WIDTH} height={HEIGHT} fill="url(#blueGlow)" />
			<rect width={WIDTH} height={HEIGHT} fill="url(#leftGlow)" />
			<rect
				x={plateX}
				y={plateY}
				width={plateWidth}
				height={plateHeight}
				rx="32"
				fill="url(#textPlate)"
			/>

			{lines.map((line, index) => {
				const y = startY + index * lineHeight;

				return (
					<text
						key={`${line}-${y}`}
						x={contentX}
						y={y}
						fill="#0f172a"
						fontSize={fontSize}
						fontWeight="700"
						letterSpacing="-0.03em"
						fontFamily="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif"
					>
						{line}
					</text>
				);
			})}

			<text
				x={contentX}
				y={descriptionY}
				fill="#475569"
				fontSize="28"
				fontWeight="500"
				letterSpacing="-0.02em"
				fontFamily="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif"
			>
				{description}
			</text>

			<text
				x={contentX}
				y={footerY}
				fill="#64748b"
				fontSize="24"
				fontWeight="600"
				letterSpacing="-0.02em"
				fontFamily="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif"
			>
				{domain}
			</text>
		</svg>
	);
}
