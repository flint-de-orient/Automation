import { MessageCircle } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
        <MessageCircle className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">Unibox</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Omnichannel CRM
        </span>
      </div>
    </div>
  );
}
