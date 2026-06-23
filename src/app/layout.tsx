import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ServerErrorNotification from '@/components/ServerErrorNotification';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'optional', // Avoid font swap flashing, show custom font if loaded quickly, otherwise use fallback
  preload: true, // Preload fonts to improve loading speed
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'optional', // Avoid font swap flashing, show custom font if loaded quickly, otherwise use fallback
  preload: true, // Preload fonts to improve loading speed
});

export const metadata: Metadata = {
  title: 'Eko Studio',
  description: 'AI Agent Studio powered by Eko',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
          enableSystem={false}
        >
          <ServerErrorNotification />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
