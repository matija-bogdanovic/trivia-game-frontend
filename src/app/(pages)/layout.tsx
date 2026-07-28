import Header from '../components/general/header';
import ReconnectBanner from '../components/general/reconnect_banner';

export default function NonDynamicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pt-[100px]">
      <Header />
      <ReconnectBanner />
      {children}
    </div>
  );
}
