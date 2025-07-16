import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon: Icon,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10 ${className}`}
      size="icon"
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}
