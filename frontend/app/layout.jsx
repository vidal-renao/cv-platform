import './globals.css';
import { I18nProvider } from '../lib/i18n';
import Navbar from '../components/Navbar';
import WhatsAppButton from '../components/WhatsAppButton';

export const metadata = {
  title: 'CV Platform',
  description: 'CV Platform SaaS Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        <I18nProvider>
          <Navbar />
          {children}
          <WhatsAppButton />
        </I18nProvider>
      </body>
    </html>
  );
}
