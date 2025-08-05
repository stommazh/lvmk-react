# @lvmk/react

Collection of hooks and utility functions library.

## Features

- 🚀 **Type-safe state management** with Immer integration
- 🌍 **Internationalization (i18n)** with namespace support and React hooks
- 🔄 **SSR support** for server-side rendering
- 📦 **Tree-shakeable** ES modules
- 🎯 **Full TypeScript support** with strict type checking

## Installation

```bash
npm install @lvmk/react
```

## API Reference

### State Management

#### `createStateManager<State>(instanceId?: string)`

Creates a comprehensive state management system using React Context and Immer for immutable updates.

**Parameters:**
- `instanceId` (optional): Unique identifier for the state manager instance

**Returns:** Object containing:
- `Provider`: React component to provide state context
- `useState`: Hook for full state access (read + write + computed values)
- `useStateValue`: Hook for read-only state access with computed values
- `useSetState`: Hook for write-only state access
- `useSnapshot`: Hook for synchronous state snapshot access
- `StateSynchronizer`: Component for syncing external props to state
- `withProvider`: HOC to automatically wrap components with state provider

**Usage example:**
1. Define the shape of your app/component state
```tsx
// app-state.ts
import { createStateManager } from '@lvmk/react'

export interface AppState {
  theme: 'light' | 'dark'
  language: 'en' | 'vi' | 'es'
  user: { id: string; name: string } | null
}

export const { 
  Provider, 
  useState: useAppState, 
  useSetState: useSetAppState, 
  withProvider
} = createStateManager<AppState>()
```
2. Use the `Provider` to wrap your app or component tree
```tsx
// app.tsx

import { Provider } from './app-state'

function App() {
  return (
    <Provider initialState={{ user: null, todos: [] }}>
      <TodoApp />
    </Provider>
  )
}
```
For Next.js, you can also fetch data from server-side and pass it to the `Provider`:
```tsx
// app.tsx (Next.js)
import { cookies } from 'next/headers' 
import {api} from '/api'

async function App() {
  const cookieStore = await cookies()
  
  return (
    <Provider 
      initialState={{ 
          user: await api.get('/user'), 
          todos: await api.get('/todos'),
          theme: cookieStore.get('theme')?.value || 'light',
        language: cookieStore.get('locale')?.value || 'en'
    }}>
      <TodoApp />
    </Provider>
  )
}

```
3. Access state in components using hooks
```tsx
// ManageTodo.tsx
import { useAppState, AppState } from './app-state'

const getUserAndTodos = (state: AppState) => ({
  user: state.user,
  todos: state.todos
})

function ManageTodo() {
  const [{user, todos}, setState] = useAppState(getUserAndTodos)
  
  const addTodo = (text: string) => {
    const newTodo = { id: Date.now().toString(), text, completed: false }
    /** 
     * setState also return a function to revert changes if needed
     * you can leaverage this to update state optimistically
     * and revert if API call fails
     * */
    const revertAddTodo = setState(draft => {
      draft.todos.push(newTodo)
    })
    api.post('/todos', newTodo).catch(revertAddTodo)
  }
  
  if (!user) {
    return <div>Please log in to manage todos.</div>
  }

  return (
    <div>
      <p>Todos: {todos.length}</p>
      <button onClick={() => addTodo('New task')}>Add Todo</button>
    </div>
  )
}
```

#### `withProvider(Component, options)`
Useful if you want to access state directly without `Provider` and update state partially base on component props.

```tsx
import { withProvider, useAppState, AppState } from './app-state'

function TodoList(props: AppState) {
  const [todos, setState] = useAppState(state => state.todos)
  // Rest of component...
}

export default withProvider(TodoList, {
  initialState: { todos: [], theme: 'light' }, // you can provide initial state value from fetching API or other sources
  // Optional - On component prop changed, update state
  bindPropToState: (state, componentProps) => {
    /** 
     * When props changes, only update and re-render component if 'theme' value is different from previous
     * This is useful for components that need to update its state based on external props
     * */
    state.theme = componentProps.theme || 'light'
  }
})
```

### Internationalization (i18n)

#### `defineLocale<Language>()`

Creates a locale-specific translation factory with full type safety for your supported languages.

**Type Parameters:**
- `Language`: Union type of supported language strings (e.g., `'en' | 'vi' | 'fr'`)

**Returns:** Object containing utility functions:
- `assertTranslation`: Type-safe translation definition helper
- `createTranslatorHook`: Factory for creating React translation hooks
- `createTranslator`: Language-specific translator function, useful for server-side rendering or non-React contexts

#### Usage
1. Define supported languages
```tsx
/** i18n/index.ts */

import { defineLocale } from '@lvmk/react'

type Language = 'en' | 'vi' | 'es'

export const { assertTranslation, createTranslator, createTranslatorHook } = defineLocale<Language>()
```
2. Define translation
```tsx
/** i18n/translation/onboarding.ts */

import {assertTranslation} from '../'

export const ONBOARDING_TRANSLATION = assertTranslation({
  welcome: {en: "Welcome", vi: "Chào mừng", es: "Bienvenido"},
  greeting: {
    en: "Hello name!",
    vi: "Xin chào name!",
    es: "¡Hola name!"
  },
  auth: {
    login: {
        en: "Login",
        vi: "Đăng nhập",
        es: "Iniciar sesión"
    },
    // other deeply nested translation texts
  },
  common: {
    save: {
        en: "Save",
        vi: "Lưu",
        es: "Guardar"
    }
    // deeply nested translation texts
  },
})
```
3. Define translator hook
```tsx
// For Next.js, remember to add 'use client' on top of the file
import {createTranslatorHook, useAppStateValue} from '../'

export const { useTranslator } = createTranslatorHook({
  translation: ONBOARDING_TRANSLATION,
  usePreferredLanguage: () => useAppStateValue(state => state.locale) // Optional - Use your preferred state management to get current language
})
```
4. Use the translator hook in your components
```tsx
// LoginForm.tsx
// 'use client' is required for Next.js components
import { useAuthTranslator } from './i18n'
import { useAppStateValue } from './app-state'

function LoginPage() {
  const { t, d, language } = useTranslator()
  const currentUserName = useAppStateValue(state => state.user?.name || 'Guest')
  
  return (
    <div data-lang={language}>
      <p>{t(d.greeting, { name: currentUserName })}</p>
    </div>
  )
}
```

#### Stateless translation on Server-Side Rendering (SSR)

```tsx
// utils/i18n-server.ts
import { cookies } from 'next/headers'
import { defineLocale } from '@lvmk/react'

const { createTranslator } = defineLocale<Language>()

export async function getServerTranslator() {
  const cookieStore = await cookies()
  const language = (cookieStore.get('language')?.value || 'en') as Language
  return createTranslator(language)
}
```

```tsx
// page.tsx (Next.js App Router)
import { getServerTranslator, translations } from './utils/i18n-server'

export default async function HomePage() {
  const t = await getServerTranslator()
  
  // Static render, content does not change on client even if language changes
  
  return (
      <h1>{t(ONBOARDING_TRANSLATION.welcome)}</h1>
  )
}
```

**Namespace Optimization**
```tsx
// Only load specific namespaces for faster translation reference
function AuthPage() {
  const { t, d } = useTranslator('auth') // Only use auth namespace
  return <div>{t(d.login)}</div> // d is now shorthand of ONBOARDING_TRANSLATION.auth
}

function MultiFeaturePage() {
  const { t, d } = useTranslator(['auth', 'common']) // Multiple namespaces
  return (
    <div>
      <button>{t(d.auth.login)}</button>
      <button>{t(d.common.save)}</button>
    </div>
  )
}
```

**Dynamic Language Switching**
```tsx
// LanguageSwitcher.tsx
import { useCurrentLanguage } from './i18n'
import { useSetAppState } from './app-state'

function LanguageSwitcher() {
  const { t, d, language } = useTranslator('common')
  const setAppState = useSetAppState()
  
  const switchLanguage = (newLang: Language) => {
    setAppState(draft => {
      draft.language = newLang
    })
    document.cookie = `language=${newLang}; path=/`
  }
  
  return (
    <select value={language} onChange={(e) => switchLanguage(e.target.value as Language)}>
      <option value="en">English</option>
      <option value="vi">Tiếng Việt</option>
    </select>
  )
}
```

## Type Safety

Both state management and internationalization systems provide full TypeScript support:

- **State Management**: Automatic type inference for state shape and mutations
- **Internationalization**: Compile-time validation of translation keys and language coverage
- **IDE Support**: Full autocompletion and error checking

## License

MIT
