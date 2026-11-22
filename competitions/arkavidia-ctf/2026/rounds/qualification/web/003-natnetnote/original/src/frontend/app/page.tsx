import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Welcome to Natnetnote
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Create, organize, and manage your notes efficiently. 
        Stay updated with announcements from your organization.
        Satisfy your rat desire
      </p>
      <div className="flex justify-center space-x-4">
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition"
        >
          Get Started
        </Link>
        <Link
          href="/about"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold transition"
        >
          Learn More
        </Link>
      </div>
      <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">📝 Notes</h3>
          <p className="text-gray-600">Create and manage your personal notes with ease</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">📢 Announcements</h3>
          <p className="text-gray-600">Stay updated with the latest announcements</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">🔒 Secure</h3>
          <p className="text-gray-600">Your data is safe and private with cutting edge security</p>
        </div>
      </div>
    </div>
  );
}