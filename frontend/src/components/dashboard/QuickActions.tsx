import { Plus, Upload, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Plus;
  color: string;
  path: string;
}

const actions: QuickAction[] = [
  {
    id: "manual",
    label: "Add Event",
    description: "Create manually",
    icon: Plus,
    color: "bg-primary text-primary-foreground hover:bg-primary/90",
    path: "/appointments/new",
  },
  {
    id: "ai",
    label: "AI Create",
    description: "From text or voice",
    icon: Sparkles,
    color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90",
    path: "/ai-assistant",
  },
  {
    id: "upload",
    label: "Upload",
    description: "From flyer or email",
    icon: Upload,
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    path: "/ai-assistant",
  },
  {
    id: "voice",
    label: "Voice",
    description: "Speak to add",
    icon: Mic,
    color: "bg-accent text-accent-foreground hover:bg-accent/80",
    path: "/ai-assistant",
  },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    navigate(action.path);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
              action.color
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <action.icon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-medium">{action.label}</p>
              <p className="text-xs opacity-80">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
