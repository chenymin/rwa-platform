'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions, useTransactionFilters, Transaction } from '@/lib/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  ArrowRightLeft,
  KeyRound,
  Wallet,
} from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { EXPLORER_URL } from '@/lib/contracts';

// 交易类型配置
const EVENT_TYPES = [
  { value: 'mint', label: '购买', icon: ShoppingCart, color: 'bg-green-100 text-green-800' },
  { value: 'transfer', label: '转账', icon: ArrowRightLeft, color: 'bg-blue-100 text-blue-800' },
  { value: 'approval', label: '授权', icon: KeyRound, color: 'bg-yellow-100 text-yellow-800' },
];

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { authenticated, login } = usePrivy();
  const { filters, page, updateFilters, clearFilters, goToPage } = useTransactionFilters();
  const { data, isLoading, error } = useTransactions(filters, page, 20);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // 未登录状态
  if (!authenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">请先登录</h2>
            <p className="text-muted-foreground text-center mb-6">
              登录后即可查看您的交易记录
            </p>
            <Button onClick={login}>登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载中
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 搜索处理
  const handleSearch = () => {
    updateFilters({ search: searchInput || undefined });
  };

  // 类型筛选
  const handleTypeChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ type: undefined });
    } else {
      updateFilters({ type: [value] });
    }
  };

  // 获取类型配置
  const getEventConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 缩短地址
  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* 页面标题 */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">交易记录</h1>
        <p className="text-sm md:text-base text-muted-foreground">查看您的所有链上交易</p>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-end">
            {/* 搜索框 */}
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1 block">搜索交易哈希</label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入交易哈希..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-9 md:h-10"
                />
                <Button variant="outline" size="icon" onClick={handleSearch} className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 类型筛选 */}
            <div className="w-full sm:w-[150px]">
              <label className="text-sm text-muted-foreground mb-1 block">交易类型</label>
              <Select
                value={filters.type?.[0] || 'all'}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 高级筛选按钮 */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              高级筛选
            </Button>

            {/* 清除筛选 */}
            {(filters.type || filters.search || filters.startDate || filters.minAmount) && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                清除筛选
              </Button>
            )}
          </div>

          {/* 高级筛选面板 */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">开始时间</label>
                <Input
                  type="datetime-local"
                  value={filters.startDate?.slice(0, 16) || ''}
                  onChange={(e) => updateFilters({
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })}
                  className="h-9 md:h-10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">结束时间</label>
                <Input
                  type="datetime-local"
                  value={filters.endDate?.slice(0, 16) || ''}
                  onChange={(e) => updateFilters({
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })}
                  className="h-9 md:h-10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">最小金额</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilters({ minAmount: e.target.value || undefined })}
                  className="h-9 md:h-10"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">最大金额</label>
                <Input
                  type="number"
                  placeholder="不限"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilters({ maxAmount: e.target.value || undefined })}
                  className="h-9 md:h-10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交易列表 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500">
              {error.message}
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mb-4" />
              <p>暂无交易记录</p>
            </div>
          ) : (
            <>
              {/* 手机端卡片视图 */}
              <div className="md:hidden divide-y">
                {data.data.map((tx) => {
                  const config = getEventConfig(tx.event_type);
                  const Icon = config.icon;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(tx.block_timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {tx.token_amount_formatted || '0'} ART
                          </div>
                          {tx.usdt_amount_formatted && (
                            <div className="text-xs text-muted-foreground">
                              ≈ {tx.usdt_amount_formatted} USDT
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {shortAddress(tx.tx_hash)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`${EXPLORER_URL}/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 桌面端表格视图 */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>交易哈希</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((tx) => {
                    const config = getEventConfig(tx.event_type);
                    const Icon = config.icon;

                    return (
                      <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono">
                          {shortAddress(tx.tx_hash)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {tx.token_amount_formatted || '0'} ART
                          </div>
                          {tx.usdt_amount_formatted && (
                            <div className="text-sm text-muted-foreground">
                              ≈ {tx.usdt_amount_formatted} USDT
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTime(tx.block_timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTx(tx)}
                            >
                              详情
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a
                                href={`${EXPLORER_URL}/tx/${tx.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* 分页 */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 md:py-4 border-t">
                  <div className="text-xs md:text-sm text-muted-foreground">
                    <span className="hidden sm:inline">共 {data.pagination.total} 条记录，</span>
                    第 {page} / {data.pagination.totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden md:inline ml-1">上一页</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                    >
                      <span className="hidden md:inline mr-1">下一页</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 交易详情弹窗 */}
      <TransactionDetailDialog
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

// 交易详情弹窗组件
function TransactionDetailDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  const config = EVENT_TYPES.find(t => t.value === transaction.event_type) || EVENT_TYPES[0];
  const Icon = config.icon;

  // 格式化 Gas 费用
  const gasUsed = transaction.gas_used || 0;
  const gasPrice = transaction.gas_price ? BigInt(transaction.gas_price) : BigInt(0);
  const gasFee = gasUsed && gasPrice
    ? (Number(BigInt(gasUsed) * gasPrice) / 1e18).toFixed(6)
    : '0';

  return (
    <Dialog open={!!transaction} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary" className={config.color}>
              <Icon className="h-4 w-4 mr-1" />
              {config.label}
            </Badge>
            交易详情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 业务描述 */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-medium">{transaction.description}</p>
          </div>

          {/* 详细信息 */}
          <div className="space-y-3">
            <DetailRow label="交易哈希" value={transaction.tx_hash} mono copyable />
            <DetailRow label="区块号" value={transaction.block_number.toString()} />
            <DetailRow
              label="时间"
              value={new Date(transaction.block_timestamp).toLocaleString('zh-CN')}
            />
            <DetailRow label="发送方" value={transaction.from_address} mono copyable />
            <DetailRow label="接收方" value={transaction.to_address} mono copyable />

            {transaction.token_amount_formatted && (
              <DetailRow
                label="代币数量"
                value={`${transaction.token_amount_formatted} ART-RWA`}
              />
            )}

            {transaction.usdt_amount_formatted && (
              <DetailRow
                label="USDT 金额"
                value={`${transaction.usdt_amount_formatted} USDT`}
              />
            )}

            <DetailRow label="Gas 费用" value={`${gasFee} BNB`} />
          </div>

          {/* 区块链浏览器链接 */}
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full gap-2" asChild>
              <a
                href={`${EXPLORER_URL}/tx/${transaction.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                在区块链浏览器中查看
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 详情行组件
function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 长值（如地址、哈希）在手机上垂直堆叠
  const isLongValue = mono && value.length > 20;

  return (
    <div className={`${isLongValue ? 'flex flex-col gap-1' : 'flex justify-between items-start gap-4'}`}>
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span
        className={`text-sm ${isLongValue ? 'text-left' : 'text-right'} break-all ${mono ? 'font-mono text-xs' : ''} ${copyable ? 'cursor-pointer hover:text-primary active:text-primary/80' : ''}`}
        onClick={copyable ? handleCopy : undefined}
      >
        {value}
        {copyable && (
          <span className="ml-2 text-xs text-muted-foreground">
            {copied ? '✓ 已复制' : '点击复制'}
          </span>
        )}
      </span>
    </div>
  );
}
