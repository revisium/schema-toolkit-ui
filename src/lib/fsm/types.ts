export type TransitionResult<TState extends string, TContext> = {
  target: TState;
  context?: Partial<TContext>;
};

export type TransitionFn<TState extends string, TContext> = (
  context: TContext,
) => TransitionResult<TState, TContext>;

export type GuardedTransition<TState extends string, TContext> = {
  target: TState;
  guard?: (context: TContext) => boolean;
  action?: (context: TContext) => void;
};

export type TransitionConfig<TState extends string, TContext> =
  | TState
  | TransitionFn<TState, TContext>
  | GuardedTransition<TState, TContext>;

export type TransitionMap<
  TState extends string,
  TEvent extends string,
  TContext,
> = Record<TState, Partial<Record<TEvent, TransitionConfig<TState, TContext>>>>;

export interface ObservableFSMConfig<
  TState extends string,
  TEvent extends string,
  TContext,
> {
  initial: TState;
  context: TContext;
  transitions: TransitionMap<TState, TEvent, TContext>;
  onTransition?: (from: TState, to: TState, event: TEvent) => void;
  onUnhandledEvent?: (state: TState, event: TEvent) => void;
}

export type ResolvedTransition<TState extends string, TContext> = {
  target: TState;
  context?: Partial<TContext>;
  action?: (context: TContext) => void;
};
