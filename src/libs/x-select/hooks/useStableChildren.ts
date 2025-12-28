import React from 'react';

/**
 * Type for children that can be either a ReactElement or a render function.
 *
 * @template P - The props type for the injected props
 */
export type RenderableChildren<P> =
  | React.ReactElement<Partial<P>>
  | ((props: P) => React.ReactNode);

/**
 * Stabilize children reference to prevent unnecessary re-renders.
 *
 * - ReactElement: compare by component type and key
 * - Render function: compare by reference
 *
 * @template P - The props type for the injected props
 * @param children - ReactElement or render function
 * @returns Stable children reference
 *
 * @example
 * ```tsx
 * interface InjectedProps {
 *   value: string;
 *   onChange: (v: string) => void;
 * }
 *
 * // In wrapper component:
 * const stableChildren = useStableChildren<InjectedProps>(children);
 *
 * // Type-safe render:
 * if (typeof stableChildren === 'function') {
 *   return stableChildren(injectedProps); // injectedProps must be InjectedProps
 * }
 * ```
 */
export function useStableChildren<P>(
  children: RenderableChildren<P>
): RenderableChildren<P> {
  const ref = React.useRef(children);
  const cached = ref.current;

  const isBothReactElement = React.isValidElement(children) && React.isValidElement(cached);
  if (isBothReactElement) {
    const hasComponentChanged = children.type !== cached.type || children.key !== cached.key;
    if (hasComponentChanged) {
      ref.current = children;
    }
    return ref.current;
  }

  const hasRenderFunctionChanged = children !== cached;
  if (hasRenderFunctionChanged) {
    ref.current = children;
  }
  return ref.current;
}