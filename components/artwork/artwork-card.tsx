import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Artwork } from '@/lib/supabase/types';

interface ArtworkCardProps {
  artwork: Artwork;
  price?: number;
  priceChange24h?: number;
}

export function ArtworkCard({ artwork, price, priceChange24h }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative">
          <Image
            src={artwork.image_url || '/placeholder.png'}
            alt={artwork.title}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <CardTitle>{artwork.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{artwork.artist_name}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">{artwork.token_symbol}</span>
            {price && (
              <>
                <span className="text-lg font-bold">${price.toFixed(2)}</span>
                {priceChange24h !== undefined && (
                  <span className={priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
