"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Drawer({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/50 duration-200 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-sm",
        className
      )}
      data-slot="drawer-overlay"
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "left" | "right" | "top" | "bottom";
  showCloseButton?: boolean;
}) {
  const sideClasses = {
    right:
      "data-closed:translate-x-full data-open:translate-x-0 top-0 right-0 h-full w-full max-w-[90vw] sm:max-w-2xl lg:max-w-4xl",
    left: "data-closed:-translate-x-full data-open:translate-x-0 top-0 left-0 h-full w-full max-w-[90vw] sm:max-w-2xl lg:max-w-4xl",
    top: "data-closed:-translate-y-full data-open:translate-y-0 top-0 left-0 right-0 h-[90vh] max-h-[90vh]",
    bottom:
      "data-closed:translate-y-full data-open:translate-y-0 bottom-0 left-0 right-0 h-[90vh] max-h-[90vh]",
  };

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Popup
        className={cn(
          "data-closed:fade-out-0 data-open:fade-in-0 fixed z-50 flex flex-col gap-4 overflow-y-auto rounded-none border-l bg-background p-6 shadow-xl duration-200 data-closed:animate-out data-open:animate-in",
          sideClasses[side],
          className
        )}
        data-slot="drawer-content"
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="drawer-close"
            render={
              <Button
                className="absolute top-4 right-4"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 text-left", className)}
      data-slot="drawer-header"
      {...props}
    />
  );
}

function DrawerFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end",
        className
      )}
      data-slot="drawer-footer"
      {...props}
    >
      {children}
      {showCloseButton && (
        <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
      )}
    </div>
  );
}

function DrawerTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-semibold text-lg", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm/relaxed", className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
