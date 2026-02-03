'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SubmitArtworkForm() {
  const { authenticated, user } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to submit artwork
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission Successful!</CardTitle>
          <CardDescription>
            Your artwork has been submitted for review. We'll notify you once it's approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setSuccess(false)}>Submit Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Submit Artwork for Tokenization</CardTitle>
          <CardDescription>
            Fill in the details about your artwork and token parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Artwork Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Artwork Information</h3>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" required rows={4} />
            </div>

            <div>
              <Label htmlFor="artist_name">Artist Name *</Label>
              <Input id="artist_name" name="artist_name" required />
            </div>

            <div>
              <Label htmlFor="artist_bio">Artist Bio</Label>
              <Textarea id="artist_bio" name="artist_bio" rows={3} />
            </div>

            <div>
              <Label htmlFor="image">Artwork Image *</Label>
              <Input id="image" name="image" type="file" accept="image/*" required />
              <p className="text-sm text-muted-foreground mt-1">Max 10MB, JPG or PNG</p>
            </div>

            <div>
              <Label htmlFor="certificate">Certificate/Provenance (Optional)</Label>
              <Input id="certificate" name="certificate" type="file" accept=".pdf" />
              <p className="text-sm text-muted-foreground mt-1">PDF format, max 5MB</p>
            </div>
          </div>

          {/* Token Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Token Parameters</h3>

            <div>
              <Label htmlFor="token_name">Token Name *</Label>
              <Input id="token_name" name="token_name" placeholder="e.g., Starry Night Shares" required />
            </div>

            <div>
              <Label htmlFor="token_symbol">Token Symbol *</Label>
              <Input id="token_symbol" name="token_symbol" placeholder="e.g., STAR" required maxLength={10} />
            </div>

            <div>
              <Label htmlFor="total_supply">Total Supply *</Label>
              <Input id="total_supply" name="total_supply" type="number" placeholder="10000" required min="1" />
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive 80% of tokens, platform receives 20%
              </p>
            </div>
          </div>

          <input type="hidden" name="submitted_by" value={user?.wallet?.address || ''} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
