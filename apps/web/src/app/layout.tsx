import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'RideAI — compare rides, food & groceries with one prompt',
  description:
    'RideAI compares Ola, Uber, Rapido, Zomato, Swiggy, Zepto and Blinkit, auto-applies the best coupon for you, and deep-links into the cheapest platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-white antialiased">{children}</body>
    </html>
  );
}
