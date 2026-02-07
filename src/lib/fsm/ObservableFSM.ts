import { makeAutoObservable } from 'mobx';

import type { ObservableFSMConfig, TransitionMap } from './types';
import { resolveTransition } from './resolveTransition';

export class ObservableFSM<
  TState extends string,
  TEvent extends string,
  TContext extends object,
> {
  private _state: TState;
  private _context: TContext;
  private readonly _transitions: TransitionMap<TState, TEvent, TContext>;
  private readonly _onTransition?: (
    from: TState,
    to: TState,
    event: TEvent,
  ) => void;
  private readonly _onUnhandledEvent?: (state: TState, event: TEvent) => void;

  constructor(config: ObservableFSMConfig<TState, TEvent, TContext>) {
    this._state = config.initial;
    this._context = { ...config.context };
    this._transitions = config.transitions;
    this._onTransition = config.onTransition;
    this._onUnhandledEvent = config.onUnhandledEvent;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get state(): TState {
    return this._state;
  }

  get context(): TContext {
    return this._context;
  }

  dispatch(event: TEvent): void {
    const config = this._transitions[this._state]?.[event];

    if (config === undefined) {
      this._onUnhandledEvent?.(this._state, event);
      return;
    }

    const resolved = resolveTransition(config, this._context);

    if (!resolved) {
      return;
    }

    const from = this._state;
    this._state = resolved.target;

    if (resolved.context) {
      Object.assign(this._context, resolved.context);
    }

    resolved.action?.(this._context);
    this._onTransition?.(from, resolved.target, event);
  }

  matches(state: TState): boolean {
    return this._state === state;
  }

  dispose(): void {
    // intentionally empty — reserved for future cleanup
  }
}
