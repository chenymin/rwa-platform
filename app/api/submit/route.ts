import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supabase = await createClient();

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const artist_name = formData.get('artist_name') as string;
    const artist_bio = formData.get('artist_bio') as string;
    const token_name = formData.get('token_name') as string;
    const token_symbol = formData.get('token_symbol') as string;
    const total_supply = parseInt(formData.get('total_supply') as string);
    const submitted_by = formData.get('submitted_by') as string;
    const imageFile = formData.get('image') as File;
    const certFile = formData.get('certificate') as File | null;

    // Upload image to Supabase Storage
    const imageExt = imageFile.name.split('.').pop();
    const imagePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${imageExt}`;

    const { data: imageData, error: imageError } = await supabase.storage
      .from('artworks')
      .upload(imagePath, imageFile);

    if (imageError) throw imageError;

    const { data: { publicUrl: image_url } } = supabase.storage
      .from('artworks')
      .getPublicUrl(imagePath);

    // Upload certificate if provided
    let certificate_url = null;
    if (certFile && certFile.size > 0) {
      const certExt = certFile.name.split('.').pop();
      const certPath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${certExt}`;

      const { error: certError } = await supabase.storage
        .from('artworks')
        .upload(certPath, certFile);

      if (certError) throw certError;

      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(certPath);

      certificate_url = publicUrl;
    }

    // Insert artwork into database
    const { data, error } = await supabase
      .from('artworks')
      .insert({
        title,
        description,
        artist_name,
        artist_bio,
        token_name,
        token_symbol,
        total_supply,
        submitted_by,
        image_url,
        certificate_url,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, artwork: data });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}
