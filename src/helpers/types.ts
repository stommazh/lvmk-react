export type TAssertFunction<T> = <StrongTypedEntity extends T>(
  assertEntity: StrongTypedEntity
) => StrongTypedEntity;

export type MapValueType<Target> = Target extends Map<unknown, infer Type> ? Type : never;
export type MapKeyType<Target> = Target extends Map<infer Type, unknown> ? Type : never;

export type ExtractValue<T, V extends T> = V;

// Primitive types that should be left as-is
type Primitive = string | number | boolean | bigint | symbol | null | undefined

// Function types should be preserved
type FunctionType = (...args: any[]) => any

// Built-in objects that should be preserved
type BuiltInObjects = Date | RegExp | URL | URLSearchParams | Promise<any> | Error

// Collection types that need special handling
type CollectionTypes =
  | Map<any, any>
  | Set<any>
  | WeakMap<object, any>
  | WeakSet<object>
  | ArrayBuffer
  | SharedArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array

export type TDeepReadonly<T> = T extends Primitive
  ? T
  : T extends FunctionType
    ? T
    : T extends CollectionTypes
      ? Omit<
        T,
        "set" | "delete" | "clear" | "push" | "pop" | "shift" | "unshift" | "splice" | "sort" | "reverse" | "fill"
      >
      : T extends BuiltInObjects
        ? T
        : T extends Array<infer U>
          ? ReadonlyArray<TDeepReadonly<U>>
          // eslint-disable-next-line
          : T extends {}
            ? { readonly [K in keyof T]: TDeepReadonly<T[K]> }
            : Readonly<T>

export type TDeepMutable<T> = T extends Primitive
  ? T
  : T extends FunctionType
    ? T
    : T extends CollectionTypes
      ? T
      : T extends BuiltInObjects
        ? T
        : T extends ReadonlyArray<infer U>
          ? Array<TDeepMutable<U>>
          // eslint-disable-next-line
          : T extends {}
            ? { -readonly [P in keyof T]: TDeepMutable<T[P]> }
            : T

export type  DistributiveOmit<T, K extends PropertyKey> = T extends any ? Omit<T, K> : never;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}