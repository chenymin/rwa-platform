import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface CardGridSkeletonProps {
  count?: number
  columns?: string
}

/**
 * 卡片网格骨架屏
 * 用于: Marketplace 艺术品网格、作品列表
 */
export function CardGridSkeleton({
  count = 8,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}: CardGridSkeletonProps) {
  return (
    <div className={`grid ${columns} gap-4 md:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* 图片区域 */}
          <Skeleton className="aspect-square w-full rounded-none" />
          <CardContent className="p-4">
            {/* 标题 */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            {/* 艺术家 */}
            <Skeleton className="h-4 w-1/2 mb-3" />
            {/* 价格 */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 单个卡片骨架
 */
export function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}
