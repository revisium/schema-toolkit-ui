import type { TransitionConfig, ResolvedTransition } from './types';

export function resolveTransition<TState extends string, TContext>(
  config: TransitionConfig<TState, TContext>,
  context: TContext,
): ResolvedTransition<TState, TContext> | null {
  if (typeof config === 'string') {
    return { target: config };
  }

  if (typeof config === 'function') {
    const result = config(context);
    return {
      target: result.target,
      context: result.context,
    };
  }

  if (config.guard && !config.guard(context)) {
    return null;
  }

  return {
    target: config.target,
    action: config.action,
  };
}
