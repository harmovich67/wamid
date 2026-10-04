export default function Loading() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <div className="skeleton size-11 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-32 rounded-lg" />
          <div className="skeleton h-3 w-20 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 space-y-3 p-5">
        <div className="skeleton h-12 w-2/3 rounded-3xl" />
        <div className="skeleton ms-auto h-16 w-1/2 rounded-3xl" />
        <div className="skeleton h-10 w-1/3 rounded-3xl" />
      </div>
      <div className="border-t border-line p-3">
        <div className="skeleton h-12 rounded-2xl" />
      </div>
    </div>
  );
}
