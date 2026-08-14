import AuthShell from '@/app/(arena)/_components/auth_shell';

/**
 * Login and signup live outside (pages) so they get the arena's full-viewport
 * auth frame instead of the legacy header and its top padding. Their URLs are
 * unchanged — (auth) is a route group.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthShell>{children}</AuthShell>;
}
