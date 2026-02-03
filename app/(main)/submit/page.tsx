import { SubmitArtworkForm } from '@/components/forms/submit-artwork-form';

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit Artwork</h1>
      <SubmitArtworkForm />
    </div>
  );
}
