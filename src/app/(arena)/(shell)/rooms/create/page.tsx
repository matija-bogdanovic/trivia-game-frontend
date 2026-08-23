import RoomsShell from '../_panels/rooms_shell';

/**
 * Rooms, on the Create tab.
 *
 * Still its own route rather than a redirect to /rooms?tab=create: the URL is
 * what the sidebar highlights by and what existing links point at, so keeping
 * it real costs one file and saves every one of them.
 */
export default function Page() {
  return <RoomsShell tab="create" />;
}
