export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton h-10 w-64 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-72 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-72 rounded-3xl" />
      </div>
    </div>
  );
}
