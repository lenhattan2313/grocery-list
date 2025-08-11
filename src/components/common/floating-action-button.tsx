import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  className?: string;
  ariaLabel: string;
}

export function FloatingActionButton({
  onClick,
  icon: Icon,
  className = "",
  ariaLabel,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10 pb-safe ${className}`}
      size="icon"
      variant="third"
      aria-label={ariaLabel}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}
