import LogoPlaceholder from './logo_placeholder';

/**
 * Centred frame the auth screens sit in. Keeps the logo, background and card
 * chrome in one place so login and signup cannot drift apart.
 *
 * Translated from the Angular app's AuthShell, including the scroll fix it
 * landed. Both elements are load-bearing:
 *
 * - the outer one is a scroll port: h-dvh (a fixed height, not min-h-) is what
 *   makes taller content overflow and therefore scroll. With min-h-dvh the
 *   container simply grew past the viewport, so nothing ever overflowed within
 *   it, its own overflow-y-auto stayed dormant, and the arena's
 *   body { overflow: hidden } clipped the excess — leaving the bottom of the
 *   signup form unreachable on a short screen.
 *
 * - the inner one carries min-h-full plus centring, so a short form still sits
 *   in the middle while a tall one scrolls from its top. Putting justify-center
 *   directly on the scroll container instead clips the start of the content
 *   once it overflows, which is the same bug wearing a hat.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="arena-root show-scrollbar h-dvh overflow-y-auto overscroll-contain bg-arena-900 text-white">
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
        {/* TODO(logo): real artwork goes in <LogoPlaceholder> */}
        <div className="mb-8 h-9 shrink-0">
          <LogoPlaceholder />
        </div>

        <div className="w-full max-w-sm shrink-0 border border-white/[0.07] bg-arena-800 p-6 sm:p-8">
          {children}
        </div>

        <p className="mt-6 shrink-0 text-[10px] tracking-[0.25em] text-arena-400 uppercase">
          Ipak se okreće
        </p>
      </div>
    </div>
  );
}
