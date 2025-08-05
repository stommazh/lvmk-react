# @lvmk/react

Fast and easy-to-use React hooks library for state management and internationalization with **fine-grained rendering**, **strong TypeScript support** and **SSR supported**.

## Installation

```bash
npm install @lvmk/react
```

## State Management

```tsx
import { createStateManager } from '@lvmk/react'

// 1. Define your state shape
interface AppState {
  user: { name: string } | null
  theme: 'light' | 'dark'
  todos: Array<{ id: string; text: string; done: boolean }>
}

// 2. Create your state manager
const { Provider, useState } = createStateManager<AppState>()

// 3. Wrap your app
function App() {
  return (
    <Provider initialState={{ user: null, theme: 'light', todos: [] }}>
      <TodoList />
      <ThemeToggle />
    </Provider>
  )
}

// 4. Use state in components
function TodoList() {
  // ✨ Only re-renders when todos change, not when theme changes
  const [todos, setState] = useState(state => state.todos)
  
  const addTodo = (text: string) => {
    setState(draft => {
      draft.todos.push({ id: Date.now().toString(), text, done: false })
    })
  }
  
  return (
    <div>
      {todos.map(todo => <div key={todo.id}>{todo.text}</div>)}
      <button onClick={() => addTodo('New task')}>Add Todo</button>
    </div>
  )
}

function ThemeToggle() {
  // ✨ Only re-renders when theme changes, not when todos change
  const [theme, setState] = useState(state => state.theme)
  
  return (
    <button onClick={() => setState(draft => { 
      draft.theme = theme === 'light' ? 'dark' : 'light' 
    })}>
      Theme: {theme}
    </button>
  )
}
```


### Server-Side Rendering (Next.js)

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'

async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const initialState = {
    user: await fetchUser(),
    theme: cookieStore.get('theme')?.value || 'light',
    locale: cookieStore.get('locale')?.value || 'en'
  }
  
  return (
    <Provider initialState={initialState}>
      {children}
    </Provider>
  )
}
```


### 🎯 Fine-grained Rendering

Components only re-render when the specific state slice they use changes:

```tsx
const [todos] = useState(state => state.todos)     // Only re-renders when todos change
const [user] = useState(state => state.user)       // Only re-renders when user changes
const [theme] = useState(state => state.theme)     // Only re-renders when theme changes
```

### ✨ Key Benefits

#### 1. **Custom Selector Functions**
The return value of the selector function passed to `useState` becomes the first value of the array, allowing you to customize the shape of values you want to extract or compute from the state, instead of using multiple `useState` calls:

```tsx
// Extract and compute specific values
const [userInfo, setState] = useState(state => ({
  name: state.user?.name || 'Guest',
  isLoggedIn: !!state.user,
  todoCount: state.todos.length,
  completedTodos: state.todos.filter(todo => todo.done).length
}))

// Use computed values directly
return (
  <div>
    <h1>Welcome, {userInfo.name}!</h1>
    <p>You have {userInfo.todoCount} todos ({userInfo.completedTodos} completed)</p>
  </div>
)
```

#### 2. **Specialized Hooks**
Besides `useState`, there are other hooks designed for specific purposes:

- **`useSetState`** - Only provides the setState function, no value subscription
- **`useStateValue`** - Only provides the state value, no setState function  
- **`useSnapshot`** - Gets a snapshot of the current state without subscribing to changes

#### 3. **Access to Latest State with getSnapshot**
The third value returned from `useState` is `getSnapshot`, which returns the latest value of the state when called:

```tsx
function AsyncComponent() {
  const [todos, setState, getSnapshot] = useState(state => state.todos)
  
  const handleAsyncOperation = async () => {
    // Start with current todos
    console.log('Current todos:', todos)
    
    // Perform async operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Get the latest state (might have changed during async operation)
    const latestState = getSnapshot()
    console.log('Latest todos after delay:', latestState)
    
    // Use latest state for operation
    setState(draft => {
      draft.todos.push({
        id: Date.now().toString(),
        text: `Task created after ${latestState.length} existing todos`,
        done: false
      })
    })
  }
  
  return (
    <div>
      <button onClick={handleAsyncOperation}>
        Add Todo After Delay
      </button>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```
### 💪 Strong TypeScript Support

Get full IntelliSense and compile-time checks:

```tsx
// TypeScript knows the exact shape of your state
const [userAndTodos] = useState(state => ({
  user: state.user,     // ✅ TypeScript knows this exists
  todos: state.todos    // ✅ TypeScript knows this exists
  // missing: state.xyz  // ❌ TypeScript error - property doesn't exist
}))
```

### 🔄 Optimistic Updates Made Easy

```tsx
const addTodo = async (text: string) => {
  // Update UI immediately
  const revert = setState(draft => {
    draft.todos.push({ id: Date.now().toString(), text, done: false })
  })
  
  try {
    await api.createTodo(text)
  } catch (error) {
    revert() // Automatically revert on error
    showError('Failed to create todo')
  }
}
```


## Translation

```tsx
import { defineLocale } from '@lvmk/react'

// 1. Define supported languages
type Language = 'en' | 'es'
const { assertTranslation, createTranslatorHook } = defineLocale<Language>()

// 2. Define translations with full type safety
const messages = assertTranslation({
  welcome: {
    en: "Welcome, {name}!",
    es: "¡Bienvenido, {name}!",
  },
  button: {
    save: { en: "Save", es: "Guardar" }
  }
})

// 3. Create translation hook
const useTranslation = createTranslatorHook(messages)

// 4. Use in components
function Welcome({ userName }: { userName: string }) {
  const t = useTranslation('en') // TypeScript suggests available languages
  
  return (
    <div>
      <h1>{t('welcome', { name: userName })}</h1> {/* TypeScript suggests available keys */}
      <button>{t('button.save')}</button> {/* Nested keys work too! */}
    </div>
  )
}
```

## API Reference

### createStateManager\<State\>(instanceId?: string)

Creates a type-safe state management system with fine-grained rendering.

**Returns:**
- `Provider` - Wrap your app/component tree
- `useState` - Access state with selector for fine-grained rendering
- `useStateValue` - Read-only access to state
- `useSetState` - Write-only access to state
- `withProvider` - HOC for automatic provider wrapping

### defineLocale\<Language\>()

Creates type-safe internationalization utilities.

**Returns:**
- `assertTranslation` - Define translations with type safety
- `createTranslatorHook` - Create React translation hooks
- `createTranslator` - For server-side or non-React usage

## License

MIT
