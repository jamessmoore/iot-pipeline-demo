import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata = {
  title: 'Monitaur',
  description: 'Real-time telemetry dashboard for Texas oil well tanks',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
