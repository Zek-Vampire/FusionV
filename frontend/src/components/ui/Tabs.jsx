import { useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

export default function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
  className,
  panelClassName,
  'aria-label': ariaLabel = 'Tabs',
}) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;
  const reduce = useReducedMotion();
  const baseId = useId();
  const refs = useRef([]);

  function select(id) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  function handleKeyDown(event, index) {
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    select(tabs[next].id);
    refs.current[next]?.focus();
  }

  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="relative flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab?.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'relative z-10 inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                selected ? 'text-background' : 'text-muted hover:text-ink',
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={`${baseId}-indicator`}
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-lg bg-lime"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              {Icon ? <Icon size={15} aria-hidden="true" /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab?.content ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeTab.id}`}
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
          className={cn('mt-4', panelClassName)}
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
