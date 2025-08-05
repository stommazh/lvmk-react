# @lvmk/react

State management + internationalization with **fine-grained rendering**, **strong TypeScript support** and **SSR ready**.

## Installation

```bash
npm install @lvmk/react
```

## State Management

```tsx
import { createStateManager } from '@lvmk/react'

// 1. Define state shape
interface AppState {
  user: { name: string } | null
  theme: 'light' | 'dark'
  todos: Array<{ id: string; text: string; done: boolean }>
}

// 2. Create state manager
const { Provider, useState } = createStateManager<AppState>()

// 3. Wrap app with state provider
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

// ⚠️ NOT RECOMMENDED: Accessing entire state
function FullStateComponent() {
  // This will re-render whenever ANY part of state changes
  // Use only when you truly need all state properties
  const [state, setState] = useState(state => state)
  
  return (
    <div>
      <p>User: {state.user?.name || 'Guest'}</p>
      <p>Theme: {state.theme}</p>
      <p>Todo count: {state.todos.length}</p>
    </div>
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

Components only re-render when the specific state slice they use changes. The library automatically handles complex objects and arrays in computed state, so you don't need to worry about reference equality issues.

```tsx
// ✅ Simple property access - re-renders only when todos array value changes (not the array/object reference)
const [todos] = useState(state => state.todos)

// ✅ Complex computed object - re-renders only when relevant data changes
const [userStats] = useState(state => ({
  name: state.user?.name || 'Guest',
  isLoggedIn: !!state.user,
  totalTodos: state.todos.length,
  completedTodos: state.todos.filter(todo => todo.done).length,
  completionRate: state.todos.length > 0 ? 
    (state.todos.filter(todo => todo.done).length / state.todos.length) * 100 : 0
}))

// ✅ Complex computed array - re-renders only when todos or filter changes
// No need to worry about array reference equality
const [filteredTodos] = useState(state => 
  state.todos
    .filter(todo => state.filter === 'completed' ? todo.done : !todo.done)
    .map(todo => ({
      ...todo,
      displayText: `${todo.text} (${todo.done ? 'Done' : 'Pending'})`
    }))
)

// ✅ Nested object computation - automatic memoization handles complexity
const [dashboardData] = useState(state => ({
  user: {
    profile: state.user,
    preferences: { theme: state.theme }
  },
  todos: {
    active: state.todos.filter(t => !t.done),
    completed: state.todos.filter(t => t.done),
    summary: {
      total: state.todos.length,
      progress: state.todos.length > 0 ? 
        Math.round((state.todos.filter(t => t.done).length / state.todos.length) * 100) : 0
    }
  }
}))
```

**🔑 Automatic Optimization:** The library handles deep value equality check for complex objects/arrays and has built-in caching prevents unnecessary recalculations. Components only update when their specific computed values change

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
    const latestTodos = getSnapshot(state => state.todos) // you can acess entire state snapshot by not providing a selector
    console.log('Latest todos after delay:', latestTodos)
    
    // Use latest state for operation
    setState(draft => {
      draft.todos.push({
        id: Date.now().toString(),
        text: `Task created after ${draft.todos.length} existing todos`,
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
    en: "Welcome, name!",
    es: "¡Bienvenido, name!",
  },
  button: {
    save: { en: "Save", es: "Guardar" }
  }
})

// 3. Create translation hook
const {useTranslator} = createTranslatorHook({
  translation: messages,
  usePreferredLanguage: () => {
    // Get reactive language from your state management
    return useStateValue(state => state.language)
  }
})

// 4. Use in components
function Welcome({ userName }: { userName: string }) {
  const {
    t, // Translation function
    d // Strongly typed dictionary of translations
  } = useTranslator()
  
  return (
    <div>
      <h1>{t(d.welcome, { name: userName })}</h1> 
      <button>{t.d.button.save}</button> {/* Nested keys work too! */}
    </div>
  )
}
```

## API Reference

### createStateManager\<State\>(instanceId?: string)

Creates a type-safe state management system with fine-grained rendering and SSR support.

**Parameters:**
- `instanceId` (optional): Unique identifier for the state manager instance. Useful when you have multiple state managers in the same app.

**Returns an object with:**

#### Provider
React component that provides state context to child components.

```tsx
<Provider initialState={{ user: null, todos: [] }}>
  <App />
</Provider>
```

**Props:**
- `initialState` (optional): Initial state values for server-side rendering or component initialization
- `children`: React components that will have access to the state

#### useState\<ComputedValue\>(selector)

Primary hook for accessing and updating state with computed values.

**⚠️ Important: Selector function is required for TypeScript inference and performance optimization.**

```tsx
// ✅ RECOMMENDED: Access specific state slices
const [todos, setState, getSnapshot] = useState(state => state.todos)
const [todoCount, setState, getSnapshot] = useState(state => state.todos.length)

// ⚠️ NOT RECOMMENDED: Access entire state (causes re-renders for all state changes)
const [state, setState, getSnapshot] = useState(state => state)
```

**Parameters:**
- `selector`: **Required** pure function that selects/computes derived state `(state) => computedValue`
  - Even for entire state access, you must provide `state => state`
  - This enables TypeScript to infer the correct return type
  - Allows for fine-grained re-rendering optimization

**Returns array with:**
- `[0] state`: Current state or computed value from selector
- `[1] setState`: Function to update state (accepts partial state or Immer draft function)
- `[2] getSnapshot`: Function to get current state snapshot without subscribing

**setState examples:**
```tsx
// Partial state update
setState({ todos: newTodos })

// Immer draft function (recommended)
setState(draft => {
  draft.todos.push({ id: '1', text: 'New todo', done: false })
  draft.user.name = 'John'
})
```

#### useStateValue\<ComputedValue\>(selector)

Read-only hook for accessing state with computed values. More performant than `useState` when you don't need to update state.

```tsx
// ✅ RECOMMENDED: Access specific computed values
const todoCount = useStateValue(state => state.todos.filter(t => !t.done).length)
```

**Parameters:**
- `selector`: **Required** pure function that selects/computes derived state `(state) => computedValue`

**Returns:** Current state or computed value from selector

#### useSetState()

Write-only hook that provides only state update functionality. Use when component only needs to update state without reading it.

```tsx
function AddTodoButton() {
  const setState = useSetState()
  
  const addTodo = () => {
    setState(draft => {
      draft.todos.push({ id: Date.now().toString(), text: 'New Todo', done: false })
    })
  }
  
  return <button onClick={addTodo}>Add Todo</button>
}
```

**Returns:** setState function (same as from `useState`)

#### useSnapshot()

Hook for synchronous state snapshot access without subscribing to changes. Useful for imperative state access in event handlers or effects.

```tsx
function MyComponent() {
  const getSnapshot = useSnapshot()
  
  const handleClick = () => {
    // ✅ RECOMMENDED: Get specific state slice without subscribing
    const currentTodos = getSnapshot(state => state.todos)
    console.log('Current todos:', currentTodos)
  }
  
  return <button onClick={handleClick}>Log State</button>
}
```

**Returns:** Function to get state snapshots with optional computation:
- `getSnapshot(selector)`: **Recommended** - Returns computed value from current state
- `getSnapshot(state => state)`: Returns entire current state (use sparingly)

#### withProvider\<ComponentProps\>(component, config?)

Higher-Order Component that automatically wraps components with the state Provider.

```tsx
interface TodoListProps {
  initialTodos: Todo[]
  filter: FilterType
}

const TodoList = withProvider<TodoListProps>(
  ({ initialTodos, filter }) => {
    const [todos] = useState(state => state.todos)
    return <div>{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}</div>
  },
  {
    // Transform props to initial state
    initialState: (props) => ({
      todos: props.initialTodos,
      filter: props.filter
    }),
    // Sync prop changes to state
    bindPropToState: (draft, props) => {
      draft.filter = props.filter
    }
  }
)
```

**Parameters:**
- `component`: React component to wrap
- `config` (optional): Configuration object with:
  - `initialState`: Function to transform props to initial state `(props) => Partial<State>`
  - `bindPropToState`: Function to sync prop changes to state `(draft, props) => void`

**Returns:** Component wrapped with Provider

#### StateSynchronizer

Component for syncing external props to internal state. Useful for keeping state synchronized with changing props.

```tsx
<StateSynchronizer
  data={propsFromParent}
  updateStateOnDataChanged={(draft, props) => {
    draft.user = props.user
    draft.settings = props.settings
  }}
/>
```

**Props:**
- `data`: External data to sync to state
- `updateStateOnDataChanged`: Function that updates state based on data changes `(draft, data) => void`

---

### defineLocale\<Languages\>()

Creates type-safe internationalization utilities for the specified language union type.

```tsx
type AppLanguages = 'en' | 'es' | 'fr'
const { assertTranslation, createTranslatorHook, createTranslator } = defineLocale<AppLanguages>()
```

**Returns an object with:**

#### assertTranslation(translations)

Type assertion helper for translation definitions with compile-time validation.

```tsx
const translations = assertTranslation({
  auth: {
    login: { en: "Login", es: "Iniciar sesión", fr: "Connexion" },
    logout: { en: "Logout", es: "Cerrar sesión", fr: "Déconnexion" }
  },
  navigation: {
    home: { en: "Home", es: "Inicio", fr: "Accueil" },
    about: { en: "About", es: "Acerca de", fr: "À propos" }
  }
})
```

**Parameters:**
- `translations`: Translation definition object with nested namespaces

**Returns:** Deeply readonly version of translations for safe usage

#### createTranslatorHook(options)

Creates React hooks for translation management with namespace selection.

```tsx
const { useTranslator, createNamespacedTranslatorHook } = createTranslatorHook({
  translation: translations,
  usePreferredLanguage: () => {
    const [language] = useState(state => state.language)
    return language
  }
})
```

**Parameters:**
- `options`: Configuration object with:
  - `translation`: Complete translation definition with all namespaces
  - `usePreferredLanguage`: React hook that returns the current language

**Returns:**
- `useTranslator`: Hook for accessing translations (see below)
- `createNamespacedTranslatorHook`: Factory for creating namespace-specific hooks

#### useTranslator (from createTranslatorHook)

Flexible translation hook with multiple usage patterns:

```tsx
// Get entire translation dictionary
const { t, d, language } = useTranslator()

// Get specific namespace
const { t, d, language } = useTranslator('auth')

// Get multiple namespaces
const { t, d, language } = useTranslator(['auth', 'navigation'])

// Custom transformation
const { t, d, language } = useTranslator(trans => ({
  buttons: { login: trans.auth.login, save: trans.common.save }
}))
```

**Parameters:**
- No parameters: Returns entire translation dictionary
- `key`: Single namespace key
- `[key1, key2, ...]`: Array of namespace keys
- `selector`: Function to transform dictionary `(dict) => customShape`

**Returns:**
- `t`: Translation function `(translation, replacements?) => string`
- `d`: Selected/Computed translation dictionary (type-safe)
- `language`: Current language

#### createTranslator\<Language\>(currentLanguage)

Creates a translation function for non-React usage or server-side rendering.

```tsx
const t = createTranslator('en')
const greeting = t(
  { en: "Hello {name}!", es: "¡Hola {name}!" },
  { name: "John" }
)
// Returns: "Hello John!"
```

**Parameters:**
- `currentLanguage`: The language to translate to

**Returns:** Translation function that processes LocalizedString objects with optional interpolation

---

