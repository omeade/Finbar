import "./globals.css";

export const metadata = {
  title: "Finbar",
  description: "Budget + Stock agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--app-bg)] font-sans text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
