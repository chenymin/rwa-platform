/**
 * 历史交易回填脚本
 *
 * 使用方法:
 * 1. 确保环境变量已配置（.env.local）
 * 2. 运行: npx tsx scripts/backfill-transactions.ts
 *
 * 可选参数:
 * --from-block <number>  指定起始区块（默认：合约部署区块）
 * --to-block <number>    指定结束区块（默认：当前区块）
 * --batch-size <number>  每批处理的区块数（默认：2000）
 */

import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { bscTestnet, bsc } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

// 配置
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97')
const IS_MAINNET = CHAIN_ID === 56
const chain = IS_MAINNET ? bsc : bscTestnet

const ART_TOKEN_CONTRACT = (process.env.NEXT_PUBLIC_ART_TOKEN_CONTRACT ||
  '0x49bd8fb9ff76a933aaf7f630537bbacdccc0329c') as `0x${string}`

// 合约部署区块（需要根据实际情况调整）
const CONTRACT_DEPLOY_BLOCK = BigInt(process.env.CONTRACT_DEPLOY_BLOCK || '88295000')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 事件 ABI
const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)
const approvalEvent = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
)

// 零地址
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const params: Record<string, string> = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '')
    const value = args[i + 1]
    params[key] = value
  }

  return {
    fromBlock: params['from-block'] ? BigInt(params['from-block']) : CONTRACT_DEPLOY_BLOCK,
    toBlock: params['to-block'] ? BigInt(params['to-block']) : undefined,
    batchSize: params['batch-size'] ? parseInt(params['batch-size']) : 2000,
  }
}

async function main() {
  console.log('🚀 开始回填交易数据...')
  console.log(`📡 链: ${IS_MAINNET ? 'BSC Mainnet' : 'BSC Testnet'}`)
  console.log(`📄 合约: ${ART_TOKEN_CONTRACT}`)

  // 验证环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ 缺少 Supabase 配置，请检查 .env.local')
    process.exit(1)
  }

  // 创建客户端
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 解析参数
  const { fromBlock, toBlock: toBlockParam, batchSize } = parseArgs()

  // 获取当前区块
  const currentBlock = await publicClient.getBlockNumber()
  const toBlock = toBlockParam || currentBlock

  console.log(`📦 区块范围: ${fromBlock} - ${toBlock}`)
  console.log(`📦 批次大小: ${batchSize} 个区块`)

  let processedBlocks = BigInt(0)
  let totalEvents = 0
  let startBlock = fromBlock

  while (startBlock <= toBlock) {
    const endBlock = startBlock + BigInt(batchSize) - BigInt(1) > toBlock
      ? toBlock
      : startBlock + BigInt(batchSize) - BigInt(1)

    console.log(`\n📦 处理区块 ${startBlock} - ${endBlock}...`)

    try {
      // 获取 Transfer 事件
      const transferLogs = await publicClient.getLogs({
        address: ART_TOKEN_CONTRACT,
        event: transferEvent,
        fromBlock: startBlock,
        toBlock: endBlock,
      })

      // 获取 Approval 事件
      const approvalLogs = await publicClient.getLogs({
        address: ART_TOKEN_CONTRACT,
        event: approvalEvent,
        fromBlock: startBlock,
        toBlock: endBlock,
      })

      console.log(`  📝 Transfer: ${transferLogs.length}, Approval: ${approvalLogs.length}`)

      // 处理 Transfer 事件
      const transactions = []

      for (const log of transferLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash })

        const from = log.args.from!.toLowerCase()
        const to = log.args.to!.toLowerCase()
        const value = log.args.value!

        // 判断事件类型
        const eventType = from === ZERO_ADDRESS ? 'mint' : 'transfer'

        transactions.push({
          tx_hash: log.transactionHash,
          block_number: Number(log.blockNumber),
          block_hash: block.hash,  // 用于 reorg 检测
          block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          gas_used: Number(receipt.gasUsed),
          gas_price: receipt.effectiveGasPrice?.toString() || null,
          event_type: eventType,
          from_address: from,
          to_address: to,
          token_amount: value.toString(),
          usdt_amount: null,
          contract_address: ART_TOKEN_CONTRACT.toLowerCase(),
        })
      }

      // 处理 Approval 事件
      for (const log of approvalLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash })

        transactions.push({
          tx_hash: log.transactionHash,
          block_number: Number(log.blockNumber),
          block_hash: block.hash,  // 用于 reorg 检测
          block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          gas_used: Number(receipt.gasUsed),
          gas_price: receipt.effectiveGasPrice?.toString() || null,
          event_type: 'approval',
          from_address: log.args.owner!.toLowerCase(),
          to_address: log.args.spender!.toLowerCase(),
          token_amount: log.args.value!.toString(),
          usdt_amount: null,
          contract_address: ART_TOKEN_CONTRACT.toLowerCase(),
        })
      }

      // 批量插入
      if (transactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .upsert(transactions, {
            onConflict: 'tx_hash',
            ignoreDuplicates: true,
          })

        if (error) {
          console.error(`  ❌ 插入失败:`, error.message)
        } else {
          console.log(`  ✅ 插入 ${transactions.length} 条记录`)
          totalEvents += transactions.length
        }
      }

      // 更新同步状态
      await supabase
        .from('sync_state')
        .upsert({
          id: 1,
          contract_address: ART_TOKEN_CONTRACT.toLowerCase(),
          last_synced_block: Number(endBlock),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'contract_address',
        })

      processedBlocks = endBlock - fromBlock + BigInt(1)

    } catch (error) {
      console.error(`  ❌ 处理失败:`, error)
      // 继续处理下一批
    }

    startBlock = endBlock + BigInt(1)

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ 回填完成!')
  console.log(`📊 处理区块: ${processedBlocks}`)
  console.log(`📊 总事件数: ${totalEvents}`)
}

main().catch(console.error)
