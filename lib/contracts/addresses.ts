// 合约地址配置

// 艺术品代币合约地址
export const ART_TOKEN_CONTRACT = '0x49bd8fb9ff76a933aaf7f630537bbacdccc0329c' as const;

// 链配置
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
export const IS_MAINNET = CHAIN_ID === 56;
export const EXPLORER_URL = IS_MAINNET ? 'https://bscscan.com' : 'https://testnet.bscscan.com';
