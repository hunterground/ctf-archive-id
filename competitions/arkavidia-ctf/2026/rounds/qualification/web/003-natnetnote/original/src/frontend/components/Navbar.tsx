import Link from 'next/link';
import { cookies } from 'next/headers';

export async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const isLoggedIn = !!token;

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              Natnetnote
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/about" className="hover:text-gray-300 transition">
                About
              </Link>
              <Link href="/announcements" className="hover:text-gray-300 transition">
                Announcements
              </Link>
              {isLoggedIn && (
                <Link href="/notes" className="hover:text-gray-300 transition">
                  My Notes
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-gray-300 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}