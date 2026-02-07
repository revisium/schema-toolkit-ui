# ObservableFSM

Lightweight finite state machine with MobX-observable `state` and `context`.

## Example — Edit Flow

```
           EDIT            SAVE (guard: hasChanges)
  idle ──────────► editing ──────────────────────► idle
                     │                               ▲
                     │ CANCEL                         │
                     └────────────────────────────────┘
```

```typescript
type State = 'idle' | 'editing';
type Event = 'EDIT' | 'SAVE' | 'CANCEL';
type Context = { draft: string; savedValue: string };

const fsm = new ObservableFSM<State, Event, Context>({
  initial: 'idle',
  context: { draft: '', savedValue: '' },
  transitions: {
    idle: {
      EDIT: 'editing',
    },
    editing: {
      CANCEL: 'idle',
      SAVE: {
        target: 'idle',
        guard: (ctx) => ctx.draft !== ctx.savedValue,
        action: (ctx) => { ctx.savedValue = ctx.draft; },
      },
    },
  },
});

fsm.state;    // 'idle'
fsm.dispatch('EDIT');
fsm.state;    // 'editing'

fsm.dispatch('SAVE');
fsm.state;    // 'editing' — guard blocked (draft === savedValue)

fsm.context.draft = 'new value';
fsm.dispatch('SAVE');
fsm.state;    // 'idle' — guard passed, action saved the value
fsm.context;  // { draft: 'new value', savedValue: 'new value' }
```

## API

```typescript
const fsm = new ObservableFSM({
  initial: 'idle',
  context: { count: 0 },
  transitions: { /* ... */ },
  onTransition: (from, to, event) => {},    // optional
  onUnhandledEvent: (state, event) => {},   // optional
});

fsm.state;              // current state (observable)
fsm.context;            // current context (observable)
fsm.dispatch(event);    // trigger transition
fsm.matches('idle');    // check state
fsm.dispose();          // cleanup
```

## Transition Config — 3 forms

```typescript
transitions: {
  // 1. String — static unconditional
  idle: { CLICK: 'active' },

  // 2. Function — dynamic, can update context
  active: {
    TICK: (ctx) => ({
      target: 'active',
      context: { count: ctx.count + 1 },
    }),
  },

  // 3. Object — guard blocks transition, action runs after
  editing: {
    SAVE: {
      target: 'idle',
      guard: (ctx) => ctx.count > 0,
      action: (ctx) => console.log('saved', ctx),
    },
  },
}
```

## File Structure

```
fsm/
├── ObservableFSM.ts      — class (MobX observable)
├── resolveTransition.ts  — TransitionConfig → ResolvedTransition | null
├── types.ts              — all type definitions
├── index.ts              — barrel export
└── __tests__/
    └── ObservableFSM.spec.ts
```
