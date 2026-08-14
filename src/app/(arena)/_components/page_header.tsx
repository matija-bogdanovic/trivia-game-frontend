/** Eyebrow + title block that opens every screen inside the shell. */
export default function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <div className="mb-1 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
        {eyebrow}
      </div>
      <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">{title}</h1>
    </div>
  );
}
