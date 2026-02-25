import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 获取交易详情
 *
 * GET /api/transactions/[hash]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;

    if (!hash) {
      return NextResponse.json(
        { error: '缺少交易哈希' },
        { status: 400 }
      );
    }

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

    // 创建 Supabase 客户端
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 设置 session
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: '会话设置失败' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      );
    }

    // 获取用户的钱包地址
    const { data: userData } = await supabase
      .from('users')
      .select('privy_user_id, wallet_address')
      .eq('auth_user_id', user.id)
      .single();

    // 查询交易详情
    const { data: transaction, error: queryError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', hash)
      .single();

    if (queryError || !transaction) {
      return NextResponse.json(
        { error: '交易不存在' },
        { status: 404 }
      );
    }

    // 验证用户有权限查看此交易
    const canView =
      transaction.user_privy_id === userData?.privy_user_id ||
      transaction.from_address.toLowerCase() === userData?.wallet_address?.toLowerCase();

    if (!canView) {
      return NextResponse.json(
        { error: '无权查看此交易' },
        { status: 403 }
      );
    }

    // 格式化返回数据
    const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN_ID === '56';
    const EXPLORER_URL = IS_MAINNET ? 'https://bscscan.com' : 'https://testnet.bscscan.com';

    const formattedTransaction = {
      ...transaction,
      // 格式化金额
      token_amount_formatted: transaction.token_amount
        ? formatAmount(transaction.token_amount, 18)
        : null,
      usdt_amount_formatted: transaction.usdt_amount
        ? formatAmount(transaction.usdt_amount, 6)
        : null,
      // Gas 费用（ETH/BNB 格式）
      gas_fee_formatted: transaction.gas_used && transaction.gas_price
        ? formatAmount(
            (BigInt(transaction.gas_used) * BigInt(transaction.gas_price)).toString(),
            18
          ) + ' BNB'
        : null,
      // 业务含义描述
      description: getTransactionDescription(transaction),
      // 区块链浏览器链接
      explorer_url: `${EXPLORER_URL}/tx/${transaction.tx_hash}`,
      address_explorer_url: {
        from: `${EXPLORER_URL}/address/${transaction.from_address}`,
        to: `${EXPLORER_URL}/address/${transaction.to_address}`,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedTransaction,
    });

  } catch (error) {
    console.error('Transaction detail API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

function formatAmount(amount: string, decimals: number): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const intPart = value / divisor;
  const decPart = value % divisor;
  const decStr = decPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${intPart}.${decStr}`.replace(/\.?0+$/, '');
}

function getTransactionDescription(tx: {
  event_type: string;
  token_amount: string | null;
  usdt_amount: string | null;
  from_address: string;
  to_address: string;
}): string {
  const tokenAmount = tx.token_amount ? formatAmount(tx.token_amount, 18) : '0';
  const usdtAmount = tx.usdt_amount ? formatAmount(tx.usdt_amount, 6) : null;

  switch (tx.event_type) {
    case 'mint':
      return usdtAmount
        ? `您购买了 ${tokenAmount} ART-RWA，花费 ${usdtAmount} USDT`
        : `您购买了 ${tokenAmount} ART-RWA`;
    case 'transfer':
      const shortTo = `${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`;
      return `您转出 ${tokenAmount} ART-RWA 到 ${shortTo}`;
    case 'approval':
      const shortSpender = `${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`;
      return `您授权 ${shortSpender} 使用 ${tokenAmount} ART-RWA`;
    default:
      return '未知交易';
  }
}
