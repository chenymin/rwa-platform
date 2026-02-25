// supabase/functions/sync-blockchain/index.ts
// 链上交易同步服务 - 从 BSC 同步 ART Token 合约事件到数据库

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BSC_RPC_URL = Deno.env.get('BSC_RPC_URL') || 'https://bsc-testnet-rpc.publicnode.com'
const ART_TOKEN_CONTRACT = Deno.env.get('ART_TOKEN_CONTRACT') || '0x49bd8fb9ff76a933aaf7f630537bbacdccc0329c'

// 事件签名（keccak256 hash）
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'

// 零地址（用于判断 mint）
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// 每次同步的最大区块数
const MAX_BLOCKS_PER_SYNC = 1000

// Reorg 安全：回退区块数（BSC 通常 15 个区块后认为安全）
const REORG_SAFETY_BLOCKS = 15

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Log {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  transactionHash: string
  blockHash: string
  logIndex: string
}

interface TransactionReceipt {
  gasUsed: string
  effectiveGasPrice: string
}

// 解析地址（从 topic 中提取）
function parseAddress(topic: string): string {
  return '0x' + topic.slice(26).toLowerCase()
}

// 解析数值（从 data 中提取）
function parseUint256(hex: string): string {
  return BigInt(hex).toString()
}

// 十六进制转数字
function hexToNumber(hex: string): number {
  return parseInt(hex, 16)
}

// 判断事件类型
function getEventType(log: Log): 'mint' | 'transfer' | 'approval' {
  if (log.topics[0] === APPROVAL_TOPIC) {
    return 'approval'
  }
  // Transfer from 0x0 = mint
  const from = parseAddress(log.topics[1])
  if (from === ZERO_ADDRESS) {
    return 'mint'
  }
  return 'transfer'
}

// RPC 调用
async function rpcCall(method: string, params: any[]): Promise<any> {
  const response = await fetch(BSC_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`)
  }
  return data.result
}

// 获取当前区块号
async function getBlockNumber(): Promise<number> {
  const result = await rpcCall('eth_blockNumber', [])
  return hexToNumber(result)
}

interface BlockInfo {
  timestamp: Date
  hash: string
}

// 获取区块信息（时间戳和哈希）
async function getBlockInfo(blockNumber: number): Promise<BlockInfo> {
  const block = await rpcCall('eth_getBlockByNumber', [
    '0x' + blockNumber.toString(16),
    false,
  ])
  return {
    timestamp: new Date(hexToNumber(block.timestamp) * 1000),
    hash: block.hash,
  }
}

// 获取交易收据（gas 信息）
async function getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
  try {
    return await rpcCall('eth_getTransactionReceipt', [txHash])
  } catch {
    return null
  }
}

// 获取事件日志
async function getLogs(fromBlock: number, toBlock: number): Promise<Log[]> {
  const logs = await rpcCall('eth_getLogs', [{
    address: ART_TOKEN_CONTRACT,
    fromBlock: '0x' + fromBlock.toString(16),
    toBlock: '0x' + toBlock.toString(16),
    topics: [[TRANSFER_TOPIC, APPROVAL_TOPIC]], // Transfer 或 Approval
  }])
  return logs || []
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🔄 Starting blockchain sync...')

  try {
    // 创建 Supabase 客户端（使用 service role）
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. 获取上次同步的区块
    const { data: syncState, error: syncError } = await supabase
      .from('sync_state')
      .select('last_synced_block')
      .eq('contract_address', ART_TOKEN_CONTRACT.toLowerCase())
      .single()

    let lastSyncedBlock = 0
    if (syncError && syncError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw syncError
    }
    if (syncState) {
      lastSyncedBlock = syncState.last_synced_block
    }

    console.log(`📦 Last synced block: ${lastSyncedBlock}`)

    // 2. 获取当前区块号
    const currentBlock = await getBlockNumber()
    console.log(`📦 Current block: ${currentBlock}`)

    // 3. 计算同步范围
    // Reorg 安全：每次都从 lastSyncedBlock - REORG_SAFETY_BLOCKS 开始重新同步
    // 这样即使发生 reorg，也能检测到并修复数据
    const safeFromBlock = Math.max(1, lastSyncedBlock - REORG_SAFETY_BLOCKS)
    const fromBlock = safeFromBlock
    const toBlock = Math.min(currentBlock, safeFromBlock + MAX_BLOCKS_PER_SYNC)

    // 如果完全没有新区块需要处理，直接返回
    if (fromBlock > currentBlock) {
      console.log('✅ No new blocks to sync')
      return new Response(
        JSON.stringify({ message: 'No new blocks', lastSyncedBlock, currentBlock }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📦 Syncing blocks ${fromBlock} to ${toBlock} (reorg safety: ${REORG_SAFETY_BLOCKS} blocks)`)

    // 4. 获取事件日志
    const logs = await getLogs(fromBlock, toBlock)
    console.log(`📝 Found ${logs.length} events`)

    // 5. 处理每个事件
    const transactions = []
    const blockInfoCache: Map<number, BlockInfo> = new Map()

    for (const log of logs) {
      const blockNumber = hexToNumber(log.blockNumber)
      const eventType = getEventType(log)

      // 获取区块信息（缓存）
      if (!blockInfoCache.has(blockNumber)) {
        const info = await getBlockInfo(blockNumber)
        blockInfoCache.set(blockNumber, info)
      }
      const blockInfo = blockInfoCache.get(blockNumber)!

      // 获取 gas 信息
      const receipt = await getTransactionReceipt(log.transactionHash)

      // 解析事件数据
      let fromAddress: string
      let toAddress: string
      let tokenAmount: string

      if (eventType === 'approval') {
        fromAddress = parseAddress(log.topics[1]) // owner
        toAddress = parseAddress(log.topics[2])   // spender
        tokenAmount = parseUint256(log.data)      // value
      } else {
        fromAddress = parseAddress(log.topics[1]) // from
        toAddress = parseAddress(log.topics[2])   // to
        tokenAmount = parseUint256(log.data)      // value
      }

      transactions.push({
        tx_hash: log.transactionHash,
        block_number: blockNumber,
        block_hash: blockInfo.hash,  // 用于 reorg 检测
        block_timestamp: blockInfo.timestamp.toISOString(),
        gas_used: receipt ? hexToNumber(receipt.gasUsed) : null,
        gas_price: receipt ? parseUint256(receipt.effectiveGasPrice) : null,
        event_type: eventType,
        from_address: fromAddress,
        to_address: toAddress,
        token_amount: tokenAmount,
        usdt_amount: null, // TODO: 可以从 mint 交易的 input data 解析
        contract_address: ART_TOKEN_CONTRACT.toLowerCase(),
      })
    }

    // 6. Reorg 检测与清理
    // 删除该区块范围内 block_hash 不匹配的旧交易（来自被孤立的分叉）
    const currentBlockHashes = new Map<number, string>()
    for (const [blockNum, info] of blockInfoCache) {
      currentBlockHashes.set(blockNum, info.hash)
    }

    // 获取数据库中该区块范围的现有交易
    const { data: existingTxs } = await supabase
      .from('transactions')
      .select('id, block_number, block_hash')
      .gte('block_number', fromBlock)
      .lte('block_number', toBlock)
      .eq('contract_address', ART_TOKEN_CONTRACT.toLowerCase())

    // 找出需要删除的交易（block_hash 不匹配 = 来自孤立分叉）
    const txsToDelete: string[] = []
    for (const tx of existingTxs || []) {
      const currentHash = currentBlockHashes.get(tx.block_number)
      if (currentHash && tx.block_hash !== currentHash) {
        txsToDelete.push(tx.id)
        console.log(`🔄 Reorg detected at block ${tx.block_number}: old hash ${tx.block_hash?.slice(0, 10)}... -> new hash ${currentHash.slice(0, 10)}...`)
      }
    }

    // 删除孤立分叉的交易
    if (txsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', txsToDelete)

      if (deleteError) {
        console.error('Delete reorged txs error:', deleteError)
      } else {
        console.log(`🗑️ Deleted ${txsToDelete.length} transactions from orphaned fork`)
      }
    }

    // 7. 批量插入/更新交易记录（幂等操作）
    if (transactions.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .upsert(transactions, {
          onConflict: 'tx_hash',
          ignoreDuplicates: false,  // 允许更新（以防 block_hash 变化）
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
      console.log(`✅ Upserted ${transactions.length} transactions`)
    }

    // 8. 更新同步状态
    const { error: updateError } = await supabase
      .from('sync_state')
      .upsert({
        id: 1,
        contract_address: ART_TOKEN_CONTRACT.toLowerCase(),
        last_synced_block: toBlock,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'contract_address',
      })

    if (updateError) {
      console.error('Update sync_state error:', updateError)
      throw updateError
    }

    console.log(`✅ Sync completed. Synced to block ${toBlock}`)

    return new Response(
      JSON.stringify({
        success: true,
        fromBlock,
        toBlock,
        eventsProcessed: transactions.length,
        hasMore: toBlock < currentBlock,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Sync error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
