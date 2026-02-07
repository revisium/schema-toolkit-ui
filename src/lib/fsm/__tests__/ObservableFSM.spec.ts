import { jest } from '@jest/globals';
import { autorun } from 'mobx';
import { ObservableFSM } from '../ObservableFSM';
import type { ObservableFSMConfig } from '../types';

type Light = 'red' | 'yellow' | 'green';
type LightEvent = 'NEXT' | 'RESET';
type LightContext = { count: number };

const createConfig = (
  overrides?: Partial<ObservableFSMConfig<Light, LightEvent, LightContext>>,
): ObservableFSMConfig<Light, LightEvent, LightContext> => ({
  initial: 'red',
  context: { count: 0 },
  transitions: {
    red: { NEXT: 'green' },
    green: { NEXT: 'yellow' },
    yellow: { NEXT: 'red' },
  },
  ...overrides,
});

describe('ObservableFSM', () => {
  describe('construction', () => {
    it('initializes with given state', () => {
      const fsm = new ObservableFSM(createConfig({ initial: 'green' }));

      expect(fsm.state).toBe('green');
    });

    it('initializes with given context', () => {
      const fsm = new ObservableFSM(createConfig({ context: { count: 5 } }));

      expect(fsm.context).toEqual({ count: 5 });
    });

    it('does not share context reference with config', () => {
      const context = { count: 0 };
      const fsm = new ObservableFSM(createConfig({ context }));

      context.count = 99;

      expect(fsm.context.count).toBe(0);
    });
  });

  describe('dispatch with string transitions', () => {
    it('transitions to target state', () => {
      const fsm = new ObservableFSM(createConfig());

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('green');
    });

    it('ignores unknown events in current state', () => {
      const fsm = new ObservableFSM(createConfig());

      fsm.dispatch('RESET');

      expect(fsm.state).toBe('red');
    });

    it('follows multi-step transitions', () => {
      const fsm = new ObservableFSM(createConfig());

      fsm.dispatch('NEXT');
      fsm.dispatch('NEXT');
      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('red');
    });
  });

  describe('dispatch with function transitions', () => {
    it('uses function return value as target state', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: () => ({ target: 'yellow' }) },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('yellow');
    });

    it('updates context from function return', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: {
              NEXT: (ctx) => ({
                target: 'green',
                context: { count: ctx.count + 1 },
              }),
            },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.context.count).toBe(1);
    });

    it('receives current context in function', () => {
      const fn = jest.fn(() => ({ target: 'green' as const }));
      const fsm = new ObservableFSM(
        createConfig({
          context: { count: 42 },
          transitions: {
            red: { NEXT: fn },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fn).toHaveBeenCalledWith({ count: 42 });
    });

    it('does not update context when function returns no context field', () => {
      const fsm = new ObservableFSM(
        createConfig({
          context: { count: 10 },
          transitions: {
            red: { NEXT: () => ({ target: 'green' }) },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.context.count).toBe(10);
    });
  });

  describe('dispatch with guarded transitions', () => {
    it('transitions when guard returns true', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: { target: 'green', guard: () => true } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('green');
    });

    it('does not transition when guard returns false', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: { target: 'green', guard: () => false } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('red');
    });

    it('calls action after transition', () => {
      const action = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: { target: 'green', action } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(action).toHaveBeenCalledWith(fsm.context);
    });

    it('does not call action when guard blocks', () => {
      const action = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: { target: 'green', guard: () => false, action } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(action).not.toHaveBeenCalled();
    });

    it('transitions when no guard provided (object with only target + action)', () => {
      const action = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: { NEXT: { target: 'green', action } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('green');
      expect(action).toHaveBeenCalled();
    });
  });

  describe('onTransition callback', () => {
    it('calls onTransition with from, to, event', () => {
      const onTransition = jest.fn();
      const fsm = new ObservableFSM(createConfig({ onTransition }));

      fsm.dispatch('NEXT');

      expect(onTransition).toHaveBeenCalledWith('red', 'green', 'NEXT');
    });

    it('does not call onTransition when guard blocks', () => {
      const onTransition = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          onTransition,
          transitions: {
            red: { NEXT: { target: 'green', guard: () => false } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(onTransition).not.toHaveBeenCalled();
    });

    it('does not call onTransition for unknown events', () => {
      const onTransition = jest.fn();
      const fsm = new ObservableFSM(createConfig({ onTransition }));

      fsm.dispatch('RESET');

      expect(onTransition).not.toHaveBeenCalled();
    });
  });

  describe('onUnhandledEvent callback', () => {
    it('calls onUnhandledEvent for unknown events', () => {
      const onUnhandledEvent = jest.fn();
      const fsm = new ObservableFSM(createConfig({ onUnhandledEvent }));

      fsm.dispatch('RESET');

      expect(onUnhandledEvent).toHaveBeenCalledWith('red', 'RESET');
    });

    it('does not call onUnhandledEvent when guard blocks', () => {
      const onUnhandledEvent = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          onUnhandledEvent,
          transitions: {
            red: { NEXT: { target: 'green', guard: () => false } },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(onUnhandledEvent).not.toHaveBeenCalled();
    });

    it('does not call onUnhandledEvent for known events', () => {
      const onUnhandledEvent = jest.fn();
      const fsm = new ObservableFSM(createConfig({ onUnhandledEvent }));

      fsm.dispatch('NEXT');

      expect(onUnhandledEvent).not.toHaveBeenCalled();
    });
  });

  describe('matches', () => {
    it('returns true for current state', () => {
      const fsm = new ObservableFSM(createConfig());

      expect(fsm.matches('red')).toBe(true);
    });

    it('returns false for other states', () => {
      const fsm = new ObservableFSM(createConfig());

      expect(fsm.matches('green')).toBe(false);
      expect(fsm.matches('yellow')).toBe(false);
    });
  });

  describe('MobX observability', () => {
    it('triggers autorun on state change', () => {
      const fsm = new ObservableFSM(createConfig());
      const states: Light[] = [];
      autorun(() => {
        states.push(fsm.state);
      });

      fsm.dispatch('NEXT');

      expect(states).toEqual(['red', 'green']);
    });

    it('triggers autorun on context change', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: {
              NEXT: (ctx) => ({
                target: 'green',
                context: { count: ctx.count + 1 },
              }),
            },
            green: {},
            yellow: {},
          },
        }),
      );
      const counts: number[] = [];
      autorun(() => {
        counts.push(fsm.context.count);
      });

      fsm.dispatch('NEXT');

      expect(counts).toEqual([0, 1]);
    });

    it('batches state and context update in single reaction', () => {
      const fsm = new ObservableFSM(
        createConfig({
          transitions: {
            red: {
              NEXT: () => ({
                target: 'green',
                context: { count: 99 },
              }),
            },
            green: {},
            yellow: {},
          },
        }),
      );
      const snapshots: Array<{ state: Light; count: number }> = [];
      autorun(() => {
        snapshots.push({ state: fsm.state, count: fsm.context.count });
      });

      fsm.dispatch('NEXT');

      expect(snapshots).toEqual([
        { state: 'red', count: 0 },
        { state: 'green', count: 99 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles self-transitions', () => {
      const onTransition = jest.fn();
      const fsm = new ObservableFSM(
        createConfig({
          onTransition,
          transitions: {
            red: { NEXT: 'red' },
            green: {},
            yellow: {},
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('red');
      expect(onTransition).toHaveBeenCalledWith('red', 'red', 'NEXT');
    });

    it('handles dispatch during onTransition callback', () => {
      const fsm = new ObservableFSM(
        createConfig({
          onTransition: (_from, to, _event) => {
            if (to === 'green') {
              fsm.dispatch('NEXT');
            }
          },
        }),
      );

      fsm.dispatch('NEXT');

      expect(fsm.state).toBe('yellow');
    });

    it('dispose does not throw', () => {
      const fsm = new ObservableFSM(createConfig());

      expect(() => fsm.dispose()).not.toThrow();
    });
  });
});
