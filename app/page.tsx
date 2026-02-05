// Disable static generation to fix Vercel 404 issue
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Art RWA Platform</h1>
        <p className="text-lg text-gray-600 mt-4">Loading...</p>
      </div>
    </main>
  );
}
