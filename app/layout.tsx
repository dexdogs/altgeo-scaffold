export const metadata = { title: "AltGeo Scaffold", description: "Geospatial alt-data scaffold" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
