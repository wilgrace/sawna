import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Sauna Booking Platform</h1>
        <p className="text-xl mb-10">The easiest way to book sauna sessions</p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/sign-in" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
          >
            Sign In
          </Link>
          <Link 
            href="/sign-up" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
