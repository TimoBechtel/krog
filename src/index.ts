export type Hook<Arguments = void, Context = void> = (
	args: Arguments,
	cxt: Context
) => void | Arguments | Promise<void | Arguments>;

type Hooks = {
	[key: string]: Hook<any, any>;
};

type ExtractArguments<H extends Hook<any, any>> = H extends Hook<infer Arg, any>
	? Arg
	: never;
type ExtractContext<H extends Hook<any, any>> = H extends Hook<any, infer Cxt>
	? Cxt
	: never;

/**
 * create hooks instance
 */
export function createHooks<T extends Hooks>() {
	let hooks: { [K in keyof T]?: T[K][] } = {};

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
		config?: { asRef?: boolean }
	): Promise<ExtractArguments<T[Key]>>;

	async function call<Key extends K>(
		name: Key,
		{
			args = undefined,
			context = undefined,
		}: {
			args?: ExtractArguments<T[Key]>;
			context?: ExtractContext<T[Key]>;
		} = {},
		{ asRef = false } = {}
	): Promise<void | ExtractArguments<T[Key]>> {
		let result = args;
		const registeredHooks = hooks[name];
		if (!registeredHooks) return result;

		if (!asRef && args) result = deepClone(args);
		for (let i = 0; i < registeredHooks.length; i++) {
			const hook = registeredHooks[i];
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
		Fn extends (...args: ExtractArguments<T[Key]>) => any
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
				return fn(...result);
			};
	}

	function register(name: K, hook: T[K]) {
		if (!hooks[name]) hooks[name] = [];
		hooks[name]?.push(hook);

		return () => unregister(name, hook);
	}

	function unregister(name: K, hook?: T[K]) {
		if (!hooks[name]) return;
		if (hook) {
			hooks[name] = hooks[name]?.filter((h) => h !== hook);
		} else {
			hooks[name] = undefined;
		}
	}

	/**
	 * convenience function to register multiple hooks at once
	 *
	 * @param hooks an object with hooks where the key is the hook name and the value is the hook
	 */
	function registerMany(hooks: Partial<T>) {
		Object.entries(hooks).forEach(([hookName, hook]) => {
			register(hookName, hook);
		});

		return () => {
			Object.entries(hooks).forEach(([hookName, hook]) => {
				unregister(hookName, hook);
			});
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
	return JSON.parse(JSON.stringify(source));
}
