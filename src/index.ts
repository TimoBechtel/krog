// Disabling this is not optimal, but it is ok for now until we have a better solution
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

// hook callbacks may return arguments or nothing (void), so we allow void here
/* eslint-disable @typescript-eslint/no-invalid-void-type */

export type Hook<Arguments = void, Context = void> = (
  args: Arguments,
  cxt: Context,
) => void | Arguments | Promise<void | Arguments>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHook = Hook<any, any>;

type Hooks = Record<string, AnyHook>;

type ExtractArguments<H extends AnyHook> = Parameters<H>[0];
type ExtractContext<H extends AnyHook> = Parameters<H>[1];

/**
 * create hooks instance
 */
export function createHooks<T extends Hooks>() {
  const hooks: { [K in keyof T]?: T[K][] } = {};

  type K = keyof T;

  /**
   * calls hook
   *
   * this function will clone passed arguments by default.
   * as this might be an intensive task, this can be disabled by setting "asRef" to true
   */
  async function call(name: K): Promise<void>;
  async function call<Key extends K>(
    name: Key,
    passedArgs: ExtractContext<T[Key]> extends void
      ? {
          args: ExtractArguments<T[Key]>;
        }
      : {
          args: ExtractArguments<T[Key]>;
          context: ExtractContext<T[Key]>;
        },
    config?: { asRef?: boolean },
  ): Promise<ExtractArguments<T[Key]>>;

  async function call<Key extends K>(
    name: Key,
    {
      args,
      context,
    }: {
      args?: ExtractArguments<T[Key]>;
      context?: ExtractContext<T[Key]>;
    } = {},
    { asRef = false } = {},
  ): Promise<void | ExtractArguments<T[Key]>> {
    let result = args;
    const registeredHooks = hooks[name];
    if (!registeredHooks) return result;

    if (!asRef && args) result = deepClone(args);
    for (const hook of registeredHooks) {
      const res = await hook(result, context);
      if (res) result = res;
    }

    return result;
  }

  /**
   * wraps a function with hooks
   *
   * it returns a function that allows you to pass a context and creates a new function that wraps the original function
   *
   */
  function wrap<
    Key extends K,
    Fn extends (...args: ExtractArguments<T[Key]>) => unknown,
  >(name: Key, fn: Fn, { asRef }: { asRef?: boolean } = {}) {
    /**
     * create a wrapped function with the given context
     */
    return (context: ExtractContext<T[Key]>) =>
      async function (...args: Parameters<Fn>): Promise<ReturnType<Fn>> {
        const callParameters = {
          // we can be sure that the passed arguments are of the correct type
          args: args as ExtractArguments<T[Key]>,
          context,
        };
        const result = await call(name, callParameters, { asRef });
        return fn(...result) as Promise<ReturnType<Fn>>;
      };
  }

  function register(name: K, hook: T[K]) {
    const hooksForName = hooks[name] ?? (hooks[name] = []);
    hooksForName.push(hook);

    return () => {
      unregister(name, hook);
    };
  }

  function unregister(name: K, hook?: T[K]) {
    const hooksForName = hooks[name];
    if (!hooksForName) return;
    hooks[name] = hook ? hooksForName.filter((h) => h !== hook) : undefined;
  }

  /**
   * convenience function to register multiple hooks at once
   *
   * @param hooks an object with hooks where the key is the hook name and the value is the hook
   */
  function registerMany(hooks: Partial<T>) {
    Object.entries(hooks).forEach(([hookName, hook]: [keyof T, T[keyof T]]) => {
      register(hookName, hook);
    });

    return () => {
      Object.entries(hooks).forEach(
        ([hookName, hook]: [keyof T, T[keyof T]]) => {
          unregister(hookName, hook);
        },
      );
    };
  }

  return {
    call,
    wrap,
    register,
    unregister,
    registerMany,
  };
}

/**
 * deeply clones arrays and objects
 * @returns
 */
function deepClone<T>(source: T): T {
  if (!source || typeof source !== 'object') return source;
  return JSON.parse(JSON.stringify(source)) as T;
}
