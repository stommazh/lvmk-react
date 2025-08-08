# @lvmk/react
Collection of React utilities

## Installation

```bash
npm install @lvmk/react
```

## Features

### [🗃️ State Management](#️-state-management)
Fine-grained reactive and cross-component state management.

### [🌐 Translation](#-translation)  
Type-safe internationalization with reactive state language switching.

---
## Upcoming
---

### Event Management
Send and listen to events across components.

---

## 🗃️ State Management

```tsx
import { createStateManager } from '@lvmk/react'

/**
 * app-state.ts
 * */
'use client' // Required if you are using Next.js

// 1. Define how global component's state should look like
export interface TodoState {
  theme: 'light' | 'dark'
  todos: Array<{ id: string; text: string; done: boolean }>
}

// 2. Create, rename and expose state managment functions
export const { 
  Provider, 
  useState: useTodoState,
  useStateValue: useTodoStateValue,
  useSnapshot: useTodoSnapshot,
} = createStateManager<TodoState>()

/** 
 * App.tsx
 * */

// 3. Wrap component in state provider. All components inside this provider will have access to the state.
function App() {
  return (
    <Provider initialState={{ user: null, theme: 'light', todos: [] }}>
      <TodoList />
      <ThemeToggle />
    </Provider>
  )
}

// 4. Access state in components

/**
 * TodoList.tsx
 * */

function TodoList() {
  const [todos, setState] = useTodoState(state => state.todos)
  
  const addTodo = (text: string) => {
    setState(draft => {
      // mutate state directly using Immer draft, no need for spread operator
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

/**
 * ThemeToggle.tsx
 * */

function ThemeToggle() {
  const [theme, setState] = useTodoState(state => state.theme)
  
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
State data can be initialed on the server for SSR support.
```tsx
// app.tsx
import { cookies } from 'next/headers'

async function App({ children }) {
  const cookieStore = await cookies()
  const initialState = {
    todos: await api.get('/todos'), // Fetch todos from API
    theme: cookieStore.get('theme')?.value || 'light'
  }
  
  return (
    <Provider initialState={initialState}>
      {children}
    </Provider>
  )
}
```

---
 👉 What this state management library offers
---
#### 🎯 Fine-grained rendering with `compute` functions
Customize derived state value with `compute` inside `useState`, all at one place.

Computed values (both primitive and non-primitive) are automatically memoized, preventing unnecessary re-renders when unrelated state changes.

```tsx
// ✅ Re-renders only when primitive values changes, not by object/array reference
const todoStats = useTodoStateValue(state => ({
  completedTodos: state.todos.filter(todo => todo.done).length,
  completionRate: state.todos.length > 0 ?
          (state.todos.filter(todo => todo.done).length / state.todos.length) * 100 : 0
}))

return  <div>
          <p>Completed Todos: {todoStats.completedTodos}</p>
          <p>Completion Rate: {todoStats.completionRate.toFixed(2)}%</p>
        </div>
```

#### 🕒 Access to the latest state value with `getSnapshot`

```tsx
function AsyncComponent() {
  const [todos, setState, getSnapshot] = useTodoState(state => state.todos)
  // or const getSnapshot = useTodoSnapshot()
  
  const handleAsyncOperation = async () => {
    // Start with current todos
    console.log('Current todos:', todos)
    
    // Perform async operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Get the latest state (might have changed during async operation)
    const latestTodos = getSnapshot(state => state.todos) // compute function is optional here
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
#### �? TypeScript Support

Get full IntelliSense and compile-time checks:

```tsx
const { todos } = useTodoStateValue(state => ({
  todos: state.todos
  // missing: state.xyz  // ❌ TypeScript error - property doesn't exist
}))

console.log(userAndTodos.user?.name) // 💡 Autocomplete works
```

#### 🔄 Optimistic Updates Made Easy

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

---

## Translation

```tsx
import { defineLocale } from '@lvmk/react'

// 1. Define supported languages
type Language = 'en' | 'vi'
const { assertTranslation, createTranslatorHook } = defineLocale<Language>()

// 2. Define translated messages with type-guarded structure
export const WELCOME_SCREEN_TRANLSATION = assertTranslation({
  welcome: {
    en: "Welcome, name!",
    vi: "Chào mừng, name!",
    // es: "¡Bienvenido, name!" // Typescript will error if you try to add unsupported language or missing translation
  },
  button: {
    save: { en: "Save", vi: "Lưu" }
  }
})

// 3. Create translation hook
export const {useTranslator} = createTranslatorHook({
  translation: WELCOME_SCREEN_TRANLSATION,
  usePreferredLanguage: () => {
    // provide current language from your preferred state management
    return useStateValue(state => state.language)
  }
})

// 4. Use in components
function Welcome({ userName }: { userName: string }) {
  const {
    t, // Translation function
    d // Strong-typed dictionary of translations, which is WELCOME_SCREEN_TRANLSATION
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
- `instanceId` (optional): Unique identifier for the state manager instance. Useful for debugging purpose or when you have multiple state managers in the same app.

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

> ####  useState\<ComputedValue\>(compute)

Primary hook for accessing and updating state with computed values.

**⚠️ Important: `compute` function is required for TypeScript inference and performance optimization.**

```tsx
// ✅ RECOMMENDED: Access specific/customized state slices
const [todoCount, setState, getSnapshot] = useState(state => state.todos.length)

// ⚠️ USE WITH CAUTION: Access entire state (causes re-renders for all state changes)
const [state, setState, getSnapshot] = useState(state => state)
```

**Parameters:**
- `compute`: **Required** pure function that selects/computes derived state `(state) => computedValue`
  - Even for entire state access, you must provide `state => state`
  - This enables TypeScript to infer the correct return type
  - Allows for fine-grained re-rendering optimization

**Returns array with:**
- `[0] computedStateValue`: Returned value from `compute` function
- `[1] setState`: Function to update state (Mutate state directly using Immer draft function)
```tsx
setState(draft => {
  draft.todos.push({ id: '1', text: 'New todo', done: false })
  draft.user.name = 'John'
})
```
- `[2] getSnapshot`: Function to get current state snapshot without subscribing

> #### useStateValue\<ComputedValue\>(compute)

Read-only hook for accessing state with computed values. More performant than `useState` when you don't need to update state.

```tsx
// ✅ RECOMMENDED: Access specific computed values
const todoCount = useStateValue(state => state.todos.filter(t => !t.done).length)
```

**Parameters:**
- `selector`: **Required** pure function that selects/computes derived state `(state) => computedValue`

**Returns:** Current state or computed value from selector

> #### useSetState()

Write-only hook that provides only state update functionality. Useful for components that only need to modify state without re-rendering on state changes.

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

> #### useSnapshot()

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
- `getSnapshot(compute?)`: Returns computed value from current state

> #### withProvider\<ComponentProps\>(component, config?)

Higher-Order Component that automatically wraps components with the state Provider and provides state-binding configuration.

```tsx
// Shape of internal cross-component search bar's state
interface SearchBarState {
  theme: 'light' | 'dark'
  isSearching: boolean
  keyword: string
}

// What properties that search bar component should accept
interface SearchBarProps {
  theme?: 'light' | 'dark'
}

const SearchBar = withProvider<SearchBarState>(
  // Actual inlined SearchBar component
  (props: SearchBarProps) => {
    
    const [state, setState] = useState(state => ({
      theme: state.theme,
      isSearching: state.isSearching,
      keyword: state.keyword
    }))
    
    return (
      <div className={`search-bar ${state.theme}`}>
        <input
          type="text"
          value={state.keyword}
          onChange={(e) => setState(draft => { draft.keyword = e.target.value })}
          placeholder="Search..."
        />
        <button onClick={() => setState(draft => { draft.isSearching = !draft.isSearching })}>
          {state.isSearching ? 'Stop' : 'Start'} Search
        </button>
      </div>
    )
  },
  // [Optional] Configuration object
  {
    // How state should be initialized
    initialState: (props: SearchBarProps) => ({
      keyword: '',
      theme: props.theme || 'light',
      isSearching: false,
    }),
    // [Optional] How state should be updated/synced when props change
    bindPropToState: (draft: SearchBarState, props: SearchBarProps) => {
      draft.theme = props.theme || 'light' // update searchbar theme when prop changes
    }
  }
)

// Consume SearchBar component in your app
function App() {
    return (
        <main>
          <SearchBar theme="dark" />
          {/* Other components */}
        </main>
  )
}
```

**Parameters:**
- `component`: React component to wrap
- `config` (optional): Configuration object with:
  - `initialState`: Function to transform props to initial state `(props) => Partial<State>`
  - `bindPropToState`: Function to sync prop changes to state `(draft, props) => void`

**Returns:** Component wrapped with Provider

> #### ⚠️ [Experimental] StateSynchronizer

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

### 🌐 Translation

Creates type-safe internationalization utilities for the specified language union type.

```tsx
type AppLanguages = 'en' | 'es' | 'fr'
const { assertTranslation, createTranslatorHook, createTranslator } = defineLocale<AppLanguages>()
```

**Returns an object with:**

> #### assertTranslation(translations)

Type assertion helper for translation definitions with compile-time validation. It ensures that all translations are provided for each language.

```tsx
const APP_TRANSLATION = assertTranslation({
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

> #### createTranslatorHook(options)

Creates React hooks for translation management with namespace selection.

```tsx
const { useTranslator, createNamespacedTranslatorHook } = createTranslatorHook({
  translation: APP_TRANSLATION,
  usePreferredLanguage: () => {
    const language = useCurrentLanguage()
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
const { t, d, language } = useTranslator('auth') // d is APP_TRANSLATION.auth

// Get multiple namespaces
const { t, d, language } = useTranslator(['auth', 'navigation']) // d is {auth: APP_TRANSLATION.auth, navigation: APP_TRANSLATION.navigation}

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

> #### createTranslator\<Language\>(currentLanguage)

Creates a translation function for static usage. Useful for server-side rendering.

```tsx

const getServerTranslator = async () => {
  return createTranslator(await cookieStore.get('language')?.value || 'en')
}

const t = await getServerTranslator()

const ONBARDING_TRANSLATION = t({
  welcome: "Welcome, username!",
})

const greeting = t(ONBARDING_TRANSLATION.welcome, { username: "John" }) // "Welcome, John!"
```

**Parameters:**
- `currentLanguage`: The language to translate to

**Returns:** Translation function that processes LocalizedString objects with optional interpolation
