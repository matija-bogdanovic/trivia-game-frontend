
import Header from "../components/general/header";

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
