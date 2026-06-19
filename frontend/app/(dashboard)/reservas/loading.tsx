import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingReservas() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50 border-b border-slate-100">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200 mb-6">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="bg-slate-50 py-2 text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
            
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-white min-h-[100px] p-2 relative">
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 justify-center">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
