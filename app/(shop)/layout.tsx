import { AIChatWidget } from '@/components/AIChatWidget';
import { Footer, Header } from '@/components/SiteShell';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="main">{children}</main>
      <Footer />
      <AIChatWidget />
    </>
  );
}
