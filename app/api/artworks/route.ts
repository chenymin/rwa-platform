import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CERTIFICATE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_CERTIFICATE_TYPES = ['application/pdf'];

interface ValidationError {
  field: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get session from header
    const sessionHeader = request.headers.get('x-supabase-session');
    if (!sessionHeader) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionHeader);
      console.log('Session data parsed successfully');
    } catch (e) {
      console.error('Failed to parse session header:', e);
      return NextResponse.json(
        { error: '无效的认证信息' },
        { status: 401 }
      );
    }

    // Validate session data
    if (!sessionData.access_token || !sessionData.refresh_token) {
      console.error('Missing access_token or refresh_token in session');
      return NextResponse.json(
        { error: '会话数据不完整' },
        { status: 401 }
      );
    }

    // Create Supabase client and set the session
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set the session explicitly
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: '会话设置失败，请重新登录' },
        { status: 401 }
      );
    }

    // Verify the user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Token verification error:', authError);
      return NextResponse.json(
        { error: '认证失败，请重新登录' },
        { status: 401 }
      );
    }

    console.log('User authenticated with auth.uid():', user.id);

    // Parse form data
    const formData = await request.formData();

    // Verify user exists and has artist role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('privy_user_id, roles')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User verification error:', userError);
      return NextResponse.json(
        { error: '无法获取用户信息' },
        { status: 403 }
      );
    }

    // Check if user has artist role
    if (!userData.roles || !userData.roles.includes('artist')) {
      return NextResponse.json(
        { error: '需要艺术家权限' },
        { status: 403 }
      );
    }

    console.log('User verified:', userData.privy_user_id);

    // Create service role client for storage operations (bypasses RLS)
    // This is safe because we've already verified authentication and roles above
    const storageSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use authenticated client for database operations
    const userSupabase = supabase;

    // Get artist profile
    const { data: artistData, error: artistError } = await userSupabase
      .from('artists')
      .select('id')
      .eq('privy_user_id', userData.privy_user_id)
      .single();

    if (artistError || !artistData) {
      return NextResponse.json(
        { error: '未找到艺术家资料，请先创建艺术家资料' },
        { status: 403 }
      );
    }

    // Extract and validate fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tokenName = formData.get('token_name') as string;
    const tokenSymbol = formData.get('token_symbol') as string;
    const totalSupply = formData.get('total_supply') as string;
    const imageFile = formData.get('image') as File;
    const certificateFile = formData.get('certificate') as File;

    // Validation
    const errors: ValidationError[] = [];

    if (!title || title.length < 3 || title.length > 200) {
      errors.push({ field: 'title', message: '标题长度必须在3-200字符之间' });
    }

    if (!description || description.length < 10 || description.length > 2000) {
      errors.push({ field: 'description', message: '描述长度必须在10-2000字符之间' });
    }

    if (!tokenName || tokenName.length < 3 || tokenName.length > 100) {
      errors.push({ field: 'token_name', message: '代币名称长度必须在3-100字符之间' });
    }

    if (!tokenSymbol || tokenSymbol.length < 2 || tokenSymbol.length > 10) {
      errors.push({ field: 'token_symbol', message: '代币符号长度必须在2-10字符之间' });
    }

    if (!/^[A-Z0-9]+$/.test(tokenSymbol)) {
      errors.push({ field: 'token_symbol', message: '代币符号只能包含大写字母和数字' });
    }

    const supply = parseInt(totalSupply);
    if (isNaN(supply) || supply < 100 || supply > 10000000) {
      errors.push({ field: 'total_supply', message: '总供应量必须在100-10,000,000之间' });
    }

    // Validate image file
    if (!imageFile || imageFile.size === 0) {
      errors.push({ field: 'image', message: '请上传作品图片' });
    } else {
      if (imageFile.size > MAX_IMAGE_SIZE) {
        errors.push({ field: 'image', message: '图片大小不能超过10MB' });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        errors.push({ field: 'image', message: '只支持 JPG, PNG, WebP 格式' });
      }
    }

    // Validate certificate file if provided
    if (certificateFile && certificateFile.size > 0) {
      if (certificateFile.size > MAX_CERTIFICATE_SIZE) {
        errors.push({ field: 'certificate', message: '证书文件不能超过5MB' });
      }
      if (!ALLOWED_CERTIFICATE_TYPES.includes(certificateFile.type)) {
        errors.push({ field: 'certificate', message: '只支持 PDF 格式' });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: '表单验证失败', errors },
        { status: 400 }
      );
    }

    // 准备文件上传
    const timestamp = Date.now();
    const imageExt = imageFile.name.split('.').pop();
    const imageFileName = `${artistData.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${imageExt}`;

    // 准备证书文件名（如果有）
    let certFileName: string | null = null;
    if (certificateFile && certificateFile.size > 0) {
      const certExt = certificateFile.name.split('.').pop();
      certFileName = `${artistData.id}/${timestamp}-cert-${Math.random().toString(36).substring(7)}.${certExt}`;
    }

    // 并行读取文件 Buffer
    const [imageBuffer, certBuffer] = await Promise.all([
      imageFile.arrayBuffer(),
      certFileName ? certificateFile.arrayBuffer() : Promise.resolve(null),
    ]);

    // 并行上传文件
    const uploadPromises: Promise<{ error: Error | null }>[] = [
      storageSupabase.storage
        .from('artworks')
        .upload(imageFileName, imageBuffer, {
          contentType: imageFile.type,
          upsert: false,
        }),
    ];

    if (certFileName && certBuffer) {
      uploadPromises.push(
        storageSupabase.storage
          .from('artworks')
          .upload(certFileName, certBuffer, {
            contentType: certificateFile.type,
            upsert: false,
          })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);
    const imageError = uploadResults[0].error;
    const certError = uploadResults[1]?.error;

    // 检查上传错误
    if (imageError) {
      console.error('Image upload error:', JSON.stringify(imageError, null, 2));
      return NextResponse.json(
        { error: '图片上传失败: ' + imageError.message, details: imageError },
        { status: 500 }
      );
    }

    if (certError) {
      console.error('Certificate upload error:', certError);
      // 清理已上传的图片
      await storageSupabase.storage.from('artworks').remove([imageFileName]);
      return NextResponse.json(
        { error: '证书上传失败' },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: { publicUrl: imageUrl } } = storageSupabase.storage
      .from('artworks')
      .getPublicUrl(imageFileName);

    let certificateUrl: string | null = null;
    if (certFileName) {
      const { data: { publicUrl } } = storageSupabase.storage
        .from('artworks')
        .getPublicUrl(certFileName);
      certificateUrl = publicUrl;
    }

    // Insert artwork record into database
    const { data: artwork, error: insertError } = await userSupabase
      .from('artworks')
      .insert({
        artist_id: artistData.id,
        title,
        description,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        total_supply: supply,
        image_url: imageUrl,
        certificate_url: certificateUrl,
        submitted_by: userData.privy_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Clean up uploaded files
      await storageSupabase.storage.from('artworks').remove([imageFileName]);
      if (certificateUrl) {
        const certFileName = certificateUrl.split('/').pop();
        if (certFileName) {
          await storageSupabase.storage.from('artworks').remove([`${artistData.id}/${certFileName}`]);
        }
      }
      return NextResponse.json(
        { error: '创建作品记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        artwork,
        message: '作品提交成功，等待审核',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Artwork submission error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
