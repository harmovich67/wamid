import { MessagesSquare } from "lucide-react";

export default function ChatsIndex() {
  return (
    <div className="grid h-full place-items-center rounded-3xl border border-dashed border-line bg-surface/50 p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary">
          <MessagesSquare className="size-8" />
        </div>
        <h2 className="text-lg font-semibold">اختر محادثة</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          اختر طالبًا من القائمة لقراءة رسائله والرد عليه. تتحكّم من داخل كل محادثة بفتح المراسلة أو إغلاقها.
        </p>
      </div>
    </div>
  );
}
