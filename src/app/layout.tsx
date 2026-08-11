import type { Metadata } from 'next';
import { Play } from 'next/font/google';
import './globals.css';
import { Providers } from './redux/provider';
import { LanguageProvider } from './lib/i18n';
import AgentationToolbar from './components/general/agentation_toolbar';

// the app-wide UI font — globals.css applies --font-play to body
const play = Play({
  variable: '--font-play',
  weight: ['400', '700'],
  // sr uses both scripts — dates render in Cyrillic
  subsets: ['latin', 'latin-ext', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Ipak se okreće',
  description:
    'Ipak se okreće — real-time trivia roulette by Matija Bogdanovic',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${play.variable} antialiased`}>
        <LanguageProvider>
          <Providers>{children}</Providers>
          <AgentationToolbar />
        </LanguageProvider>
      </body>
    </html>
  );
}
