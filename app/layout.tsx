import './globals.css';
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';

const sans = Space_Grotesk({ subsets: ['latin', 'latin-ext'], variable: '--sans' });
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--inter' });
const mono = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--mono' });

export const metadata = { title: 'Outreach Studio', description: 'Personalised decks and cold scripts' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
