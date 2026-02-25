import { Skeleton } from "@/components/ui/skeleton"

/**
 * 弹窗内容骨架屏
 * 用于: 购买弹窗等
 */
export function DialogContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* 标题区 */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* 信息列表 */}
      <div className="space-y-3 py-4 border-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* 按钮 */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

/**
 * 购买弹窗骨架
 */
export function MintDialogSkeleton() {
  return (
    <div className="space-y-4">
      {/* 作品信息 */}
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>

      {/* 价格信息 */}
      <div className="p-4 bg-muted rounded-lg space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* 数量选择 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* 购买按钮 */}
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  )
}

/**
 * 交易详情弹窗骨架
 */
export function TransactionDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* 描述 */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* 详情列表 */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className={`h-4 ${i < 2 ? 'w-full' : 'w-24'}`} />
          </div>
        ))}
      </div>

      {/* 按钮 */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}
