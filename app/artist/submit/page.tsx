import { ArtistSubmitForm } from '@/components/artworks/artist-submit-form';

export default function ArtistSubmitPage() {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">发布新作品</h1>
        <p className="text-muted-foreground">
          提交您的艺术品信息以创建数字资产代币
        </p>
      </div>
      <ArtistSubmitForm />
    </div>
  );
}
