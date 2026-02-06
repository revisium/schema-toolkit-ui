# ContentEditable

Inline text editing with `contentEditable`. Available as a standalone hook (`useContentEditable`) or as a pre-styled component (`ContentEditable`).

## `useContentEditable` hook

Returns props to spread onto any HTML element (a plain `<div>`, Chakra `<Box>`, etc.).

```tsx
import { useContentEditable } from '@revisium/schema-toolkit-ui';

function MyEditor() {
  const [name, setName] = useState('');
  const editableProps = useContentEditable({
    value: name,
    onChange: setName,
    onEnter: () => console.log('confirmed:', name),
    onEscape: () => console.log('cancelled'),
    restrict: /^[a-zA-Z0-9_-]$/,
    autoFocus: true,
  });

  return <div {...editableProps} style={{ outline: 'none' }} />;
}
```

### Options

| Option         | Type       | Description                                      |
| -------------- | ---------- | ------------------------------------------------ |
| `value`        | `string`   | Current text value (HTML-escaped internally)      |
| `onChange`      | `function` | Called with new text on every input               |
| `onBlur`       | `function` | Called when element loses focus                   |
| `onFocus`      | `function` | Called when element gains focus                   |
| `onEnter`      | `function` | Called on Enter if value is non-empty, then blurs |
| `onEscape`     | `function` | Called on Escape, then blurs                      |
| `restrict`     | `RegExp`   | Only keys matching this regex (+ nav keys) pass   |
| `autoFocus`    | `boolean`  | Focus element on mount                           |
| `focusTrigger` | `number`   | Increment to programmatically focus + select all  |

### Return value

An object of HTML attributes to spread onto the target element:

```ts
{
  ref, contentEditable, spellCheck,
  dangerouslySetInnerHTML, onInput, onBlur, onFocus, onKeyDown
}
```

## `ContentEditable` component

Pre-styled wrapper using Chakra UI. Includes placeholder text, prefix/postfix, and click-to-focus on the parent container.

```tsx
import { ContentEditable } from '@revisium/schema-toolkit-ui';

<ContentEditable
  initValue={name}
  onChange={setName}
  placeholder="Enter a name"
  autoFocus
  focusTrigger={focusCount}
/>
```

## `focusTrigger` — programmatic focus

To focus the editable from outside (e.g. after pressing a keyboard shortcut), maintain a counter and increment it:

```tsx
const [focusCount, setFocusCount] = useState(0);

// Later, when you want to focus:
setFocusCount(c => c + 1);

<ContentEditable initValue={text} focusTrigger={focusCount} />
```

The element will be focused and cursor placed at the end. The initial value is ignored (no focus on mount from `focusTrigger`).

## Cursor management

The hook preserves cursor position across React re-renders. When `value` changes (e.g. from a MobX store update), the cursor is restored to its previous position using `useLayoutEffect`. This prevents the cursor from jumping to the beginning on every keystroke.
