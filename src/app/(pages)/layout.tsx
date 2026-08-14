import Header from '../components/general/header';

/**
 * All that is left of the pre-reskin chrome. /shop is the only screen still
 * using it, and it is on hold pending a decision — if it goes, this file and
 * header.tsx go with it and (pages) disappears entirely.
 */
export default function NonDynamicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pt-[100px]">
      <Header />
      {children}
    </div>
  );
}
