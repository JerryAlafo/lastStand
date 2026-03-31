import Providers from "./providers";

export const metadata = {
  title: "Last Stand Arena",
  description: "Arena de combate — criado por Jerry Alafo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-size: 16px; -webkit-text-size-adjust: 100%; touch-action: manipulation; overflow-x: hidden; }
          button, a { touch-action: manipulation; }
          @media (max-width: 640px) {
            .auth-card { padding: 28px 20px !important; }
          }
          body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            background: #0a0010;
            color: #fff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          a { color: inherit; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
          ::-webkit-scrollbar-thumb { background: rgba(123,47,247,0.5); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(123,47,247,0.75); }
          ::selection { background: rgba(123,47,247,0.4); color: #fff; }
        `}</style>
      </body>
    </html>
  );
}
