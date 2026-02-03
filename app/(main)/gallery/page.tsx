import { createClient } from '@/lib/supabase/server';
import { ArtworkCard } from '@/components/artwork/artwork-card';

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return <div>Error loading artworks</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">探索代币化艺术品</h1>

      {!artworks || artworks.length === 0 ? (
        <p className="text-muted-foreground">暂无艺术品</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}
