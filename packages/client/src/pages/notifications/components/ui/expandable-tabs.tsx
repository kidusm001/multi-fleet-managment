"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  initialTab?: number;  // Add this prop
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
    scale: 1,
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
    scale: isSelected ? 1.02 : 1,
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0, x: -10 },
  animate: { width: "auto", opacity: 1, x: 0 },
  exit: { width: 0, opacity: 0, x: 10 }
};

const transition = { 
  type: "spring", 
  bounce: 0.2, 
  duration: 0.4,
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 }
};

export function ExpandableTabs({
  tabs,
  className,
  activeColor: _activeColor = "text-white",
  onChange,
  initialTab = 0,  // Default to first tab
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(initialTab);
  const outsideClickRef = React.useRef<HTMLDivElement | null>(null);

  useOnClickOutside(outsideClickRef, () => {
    // Collapse the visual treatment without mutating the parent filter
    setSelected((current) => (current === null ? current : null));
  });

  // Keep internal selection in sync and notify the parent only on first mount
  const hasMountedRef = React.useRef(false);
  React.useEffect(() => {
    setSelected(initialTab);
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      onChange?.(initialTab);
    }
  }, [initialTab, onChange]);

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "expandable-tabs-wrapper group flex flex-wrap items-center gap-2 rounded-xl border px-1 py-1",
        "bg-white dark:bg-slate-900", // Explicit solid backgrounds
        "border-slate-200 dark:border-slate-700",
        "shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return (
            <div 
              key={`separator-${index}`}
              className="expandable-tab-separator mx-1 h-[24px] w-[1.2px] bg-slate-200 dark:bg-slate-700"
              aria-hidden="true" 
            />
          );
        }

        const Icon = tab.icon;
        const isSelected = selected === index;
        
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={transition}
            style={{
              background: isSelected 
                ? 'linear-gradient(to right, var(--blue-500, #3b82f6), var(--blue-600, #2563eb))'
                : 'none',
              color: isSelected ? '#ffffff' : undefined
            }}
            className={cn(
              "relative flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium",
              "transition-all duration-300 overflow-hidden",
              isSelected
                ? "!text-white dark:!text-white" // Force white text in both modes
                : cn(
                    "text-slate-600 dark:text-slate-400",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/20", // Softer hover background
                    "hover:text-blue-600 dark:hover:text-blue-300", // Better hover text contrast
                    "transition-colors duration-200" // Smooth hover transition
                  )
            )}
          >
            <Icon 
              size={18} 
              className={cn(
                "flex-shrink-0 relative z-20",
                isSelected ? "!text-white dark:!text-white" : "text-current"
              )} 
            />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="ml-2 overflow-hidden whitespace-nowrap !text-white relative z-20"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}