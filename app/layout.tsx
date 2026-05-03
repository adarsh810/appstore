import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'App Store',
  description: 'A curated collection of apps built by Adarsh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
