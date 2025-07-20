import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  height: "1px",
  width: "1px",
  margin: "-1px",
  padding: "0",
  border: "0",
};

function VisuallyHidden({
  asChild,
  ...props
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const Comp = asChild ? Slot : "span";
  return <Comp style={visuallyHiddenStyle} {...props} />;
}

export { VisuallyHidden };
