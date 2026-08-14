import Sidebar from '../_components/sidebar';

/**
 * The sidebar shell. Screens own their own padding (the design's views all
 * open with p-8), so main only handles the scroll region.
 */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-full bg-g900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
