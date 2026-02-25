import { Skeleton } from "@/components/ui/skeleton"

interface CardListSkeletonProps {
  count?: number
}

/**
 * 卡片列表骨架屏（手机端）
 * 用于: 交易记录手机端列表
 */
export function CardListSkeleton({ count = 5 }: CardListSkeletonProps) {
  return (
    <div className="md:hidden divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4">
          {/* 顶部: 类型标签 + 时间 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* 底部: 金额 + 哈希 */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 交易记录骨架（响应式：手机卡片 + 桌面表格）
 */
export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {/* 手机端卡片 */}
      <CardListSkeleton count={count} />

      {/* 桌面端表格 - 导入 TableSkeleton 使用 */}
    </>
  )
}
