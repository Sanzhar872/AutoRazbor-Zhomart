import { Skeleton } from '@/components/ui/Skeleton'

export function PartCardSkeleton() {
  return (
    <div className="flex flex-col bg-bg-surface border border-border rounded-lg overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-1" />
      </div>
    </div>
  )
}
