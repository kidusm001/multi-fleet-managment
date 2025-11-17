'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, Transition, motion } from 'framer-motion';
import {
  Children,
  cloneElement,
  ReactElement,
  useEffect,
  useState,
  useId,
  CSSProperties,
} from 'react';

type ChildProps = React.HTMLAttributes<HTMLElement> & { 'data-id': string };

type AnimatedBackgroundProps = {
  children: ReactElement<ChildProps>[] | ReactElement<ChildProps>;
  defaultValue?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  style?: CSSProperties;
  transition?: Transition;
  enableHover?: boolean;
};

export default function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  style,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const uniqueId = useId();

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);

    if (onValueChange) {
      onValueChange(id);
    }
  };

  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }, [defaultValue]);

  return Children.map(children, (child: ReactElement<ChildProps>, index) => {
    const id = child.props['data-id'];

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : {
          onClick: () => handleSetActiveId(id),
        };

    return cloneElement(
      child,
      {
        key: index,
        className: cn('relative inline-flex', child.props.className),
        'aria-selected': activeId === id,
        ...interactionProps,
      },
      <>
        <AnimatePresence initial={false}>
          {activeId === id && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={cn('absolute inset-0 rounded-lg', className)}
              style={{
                ...style,
                background: style?.background || 'linear-gradient(to right, rgb(59 130 246), rgb(37 99 235))',
                boxShadow: style?.boxShadow || '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem'
              }}
              transition={transition || {
                type: "spring",
                bounce: 0.2,
                duration: 0.3
              }}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{
                opacity: 1,
                scale: 1.02
              }}
              exit={{
                opacity: 0,
                scale: 1
              }}
            />
          )}
        </AnimatePresence>
        <span className='z-10'>{child.props.children}</span>
      </>
    );
  });
}
