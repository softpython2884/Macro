import { redirect } from 'next/navigation';

export default function HomePage() {
  // The middleware will handle the redirect to /setup if needed.
  // Otherwise, it will proceed to /login.
  redirect('/login');
}
