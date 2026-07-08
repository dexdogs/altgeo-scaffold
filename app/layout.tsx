export const metadata = { title: "AltGeo // dexdogs", description: "Geospatial alt-data scaffold" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @font-face {
            font-family: "Bpdots";
            src: url("/fonts/bpdots.otf") format("opentype");
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
      </head>
      <body style={{ margin: 0 }}>
        <header style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: "#00A86B",
          borderBottom: "1px solid #007a4d",
          color: "#052e1f",
          fontFamily: "Bpdots, system-ui, sans-serif",
          fontSize: 18,
          letterSpacing: 1,
        }}>
          AltGeo // dexdogs
        </header>
        {children}
      </body>
    </html>
  );
}
