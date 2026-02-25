import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 获取用户交易列表
 *
 * GET /api/transactions
 *
 * 查询参数:
 * - type: 交易类型 (mint, transfer, approval)，多个用逗号分隔
 * - startDate: 开始时间 (ISO 格式)
 * - endDate: 结束时间 (ISO 格式)
 * - minAmount: 最小金额
 * - maxAmount: 最大金额
 * - search: 搜索交易哈希
 * - page: 页码 (默认 1)
 * - limit: 每页数量 (默认 20，最大 100)
 */
export async function GET(request: NextRequest) {
  try {
    // 获取 session
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
    } catch {
      return NextResponse.json(
        { error: '无效的认证信息' },
        { status: 401 }
      );
    }

    if (!sessionData.access_token || !sessionData.refresh_token) {
      return NextResponse.json(
        { error: '会话数据不完整' },
        { status: 401 }
      );
    }

    // 创建 Supabase 客户端
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 设置 session
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '会话设置失败，请重新登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '认证失败，请重新登录' },
        { status: 401 }
      );
    }

    // 获取用户的钱包地址
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('privy_user_id, wallet_address')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '无法获取用户信息' },
        { status: 403 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // mint,transfer,approval
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`user_privy_id.eq.${userData.privy_user_id},from_address.ilike.${userData.wallet_address?.toLowerCase()}`)
      .order('block_timestamp', { ascending: false });

    // 类型筛选
    if (type) {
      const types = type.split(',').map(t => t.trim());
      query = query.in('event_type', types);
    }

    // 时间范围筛选
    if (startDate) {
      query = query.gte('block_timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('block_timestamp', endDate);
    }

    // 金额范围筛选（token_amount）
    if (minAmount) {
      // 将输入的金额转换为最小单位（18 decimals）
      const minAmountWei = BigInt(parseFloat(minAmount) * 1e18).toString();
      query = query.gte('token_amount', minAmountWei);
    }
    if (maxAmount) {
      const maxAmountWei = BigInt(parseFloat(maxAmount) * 1e18).toString();
      query = query.lte('token_amount', maxAmountWei);
    }

    // 搜索交易哈希
    if (search) {
      query = query.ilike('tx_hash', `%${search}%`);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    // 执行查询
    const { data: transactions, count, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const formattedTransactions = transactions?.map(tx => ({
      ...tx,
      // 格式化金额（从 wei 转换为可读格式）
      token_amount_formatted: tx.token_amount
        ? (BigInt(tx.token_amount) / BigInt(1e18)).toString() +
          '.' +
          (BigInt(tx.token_amount) % BigInt(1e18)).toString().padStart(18, '0').slice(0, 4)
        : null,
      usdt_amount_formatted: tx.usdt_amount
        ? (BigInt(tx.usdt_amount) / BigInt(1e6)).toString() +
          '.' +
          (BigInt(tx.usdt_amount) % BigInt(1e6)).toString().padStart(6, '0').slice(0, 2)
        : null,
      // 业务含义描述
      description: getTransactionDescription(tx),
    }));

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 生成交易的业务含义描述
 */
function getTransactionDescription(tx: {
  event_type: string;
  token_amount: string | null;
  usdt_amount: string | null;
  from_address: string;
  to_address: string;
}): string {
  const tokenAmount = tx.token_amount
    ? formatAmount(tx.token_amount, 18)
    : '0';
  const usdtAmount = tx.usdt_amount
    ? formatAmount(tx.usdt_amount, 6)
    : null;

  switch (tx.event_type) {
    case 'mint':
      return usdtAmount
        ? `购买了 ${tokenAmount} ART-RWA，花费 ${usdtAmount} USDT`
        : `购买了 ${tokenAmount} ART-RWA`;
    case 'transfer':
      const shortTo = `${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`;
      return `转出 ${tokenAmount} ART-RWA 到 ${shortTo}`;
    case 'approval':
      const shortSpender = `${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`;
      return `授权 ${shortSpender} 使用 ${tokenAmount} ART-RWA`;
    default:
      return '未知交易';
  }
}

/**
 * 格式化金额
 */
function formatAmount(amount: string, decimals: number): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const intPart = value / divisor;
  const decPart = value % divisor;
  const decStr = decPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${intPart}.${decStr}`.replace(/\.?0+$/, '');
}
