import Providers from "./providers";

export const metadata = {
  title: "Last Stand Arena",
  description: "Arena de combate — criado por Jerry Alafo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/favicon.png" type="image/png" />
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
          html { 
            font-size: 16px; 
            -webkit-text-size-adjust: 100%; 
            touch-action: manipulation; 
            overflow-x: hidden;
            height: 100%;
            position: fixed;
            width: 100%;
          }
          body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            background: #0a0010;
            color: #fff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            height: 100%;
            overflow: hidden;
            position: fixed;
            width: 100%;
          }
          #__next {
            height: 100%;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
          button, a { touch-action: manipulation; }
          @media (max-width: 640px) {
            .auth-card { padding: 28px 20px !important; }
          }
          a { color: inherit; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
          ::-webkit-scrollbar-thumb { background: rgba(123,47,247,0.5); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(123,47,247,0.75); }
          ::selection { background: rgba(123,47,247,0.4); color: #fff; }
          /* Safe area for notched phones */
          .safe-top { padding-top: env(safe-area-inset-top, 0px); }
          .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
          .safe-left { padding-left: env(safe-area-inset-left, 0px); }
          .safe-right { padding-right: env(safe-area-inset-right, 0px); }
        `}</style>
      </body>
    </html>
  );
}
