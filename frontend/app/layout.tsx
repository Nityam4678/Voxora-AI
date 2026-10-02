import "./globals.css";

export const metadata = {
  title: "Voice RAG Assistant",
  description: "Ask questions about your documents by voice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
