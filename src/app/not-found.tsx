'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container flex flex-col justify-center items-center h-[100vh]">
        <h2>Uh oh! This page doesn&apos;t exist.</h2>
        <Link href="/" className="underline">
          Return to the homepage
        </Link>
      </div>
    </section>
  );
}
