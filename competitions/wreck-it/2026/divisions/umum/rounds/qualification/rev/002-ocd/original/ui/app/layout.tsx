import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["400"],
});

const space = Space_Grotesk({
	variable: "--font-body",
	subsets: ["latin"],
	weight: ["400", "600"],
});

const plex = IBM_Plex_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "600"],
});

export const metadata: Metadata = {
	title: "OCD",
	description: "Anxiety Anxiety Anxiety",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${bebas.variable} ${space.variable} ${plex.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
