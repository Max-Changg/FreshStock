import { Outlet } from 'react-router-dom';
import { NavBar } from '@/shared/components/NavBar';

export function Layout() {
  return (
    <div className="min-h-screen bg-cream">
      <NavBar />
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
