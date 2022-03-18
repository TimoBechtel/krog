<h1 align="center">🪝 <br/>krog</h1>
<h3 align="center">Add a hooks-based plugin system to your library.</h3>
<p align="center"><i><code>/krɔːɡ/</code>, danish: "hook"</i></p>
<p align="center">
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>
<p align="center">
  ·
  <a href="https://github.com/TimoBechtel/krog/issues">Report Bug / Request Feature</a>
  ·
</p>

## Table of Contents

- [About](#About)
  - [Features](#Features)
- [Installation](#Install)
- [Usage](#Usage)
  - [As a library author](#As-a-library-author)
  - [As a plugin author](#As-a-plugin-author)
- [Used by](#Used-by)
- [Development / Contributing](#Development-Contributing)

## About

_krog_ adds typescript aware hooks to your library to allow for more flexible and powerful plugins.

### Features ✨

- supports async hooks
- typescript support
- data can be manipulated through hooks
- full control over how plugins are configured / loaded

Example:

```typescript
const { data } = await hooks.call('before:write', {
	args: { data: 'Hello World' },
});
```

## Install

```sh
yarn add krog
```

or

```sh
npm install krog
```

## Usage

### As library author

#### 1. Create hooks instance

```js
import { createHooks } from 'krog';

const hooks = createHooks();
```

With typescript, you can add types:

```ts
import { createHooks, Hook } from 'krog';

export type AvailableHooks = {
	// first type is the arguments type, second is the context type; both are optional
	'before:write': Hook<{ data: string }, { config: any }>;
};

const hooks = createHooks<AvailableHooks>();
```

#### 2. Register hooks

Now anywhere in your code, register hooks, using `hooks.register(hookName, myFunction);` These may come from a plugin.

Note: When multiple functions are registered to the same hook, they are called in the order they were registered.

Examples:

```js
// register all hooks from a list of plugins
plugins.forEach((plugin) => {
	Object.entries(plugin.hooks).forEach(([hookName, hook]) => {
		hooks.register(hookName, hook);
	});
});

// manually register
plugins.forEach((plugin) => {
	hooks.register('before:write', plugin.beforeWrite);
});
```

#### 3. Call hooks

##### a) Wrap functions

The easiest way is to wrap existing functions using `hooks.wrap`.

This will then pass all arguments to the hook before running the initial function.

```js
// wrap your function (note the parenthesis at the end)
const wrappedPrinter = hooks.wrap('before:write', printer)();

// call the wrapped function like normal
wrappedPrinter('Hello World');
```

You can also pass a context to your wrapped function:  
(that is the reason for the parenthesis at the end)

```js
// create a function factory
const createInstance = hooks.wrap('before:write', myFunction);

// create an instance of the function with a context
const myWrappedFunction = createInstance(myContext);

// call the wrapped function like normal
myWrappedFunction(myArguments);
```

##### b) Call hooks directly

You can also call a hook anywhere in your code using `hooks.call`.

You can pass arguments to the hook, and get the result back.  
You can also pass a context object, which will be available in the hook function.

```js
const { data } = await hooks.call('before:write', {
	args: { data: dataBeforeHook },
	context: myContext,
});
```

### As plugin author

#### Create a plugin

The syntax depends on how the library handles plugins. If the library allows you to pass hooks directly, you may configure them similar like this:

```js
const upperCasePlugin = {
	hooks: {
		'before:write': (args, context) => {
			if (context.config.uppercase) {
				// if you want to modify the data, you can return a new args object (context cannot be modified)
				return {
					data: args.data.toUpperCase(),
				};
			}
			// if you don't return anything, the data will be unchanged
		},
	},
};
```

### FAQs

#### Differences between arguments and context

- The **context** is an object that is passed to all hooks. It can be used to pass data or functions that can be used in hooks but should not be modified by a hook.

- **arguments** on the other hand, are passed to the hook and can be modified by returning a modified version.

## Used by

- [socketdb](https://github.com/TimoBechtel/socketdb)
- [stapigen](https://github.com/TimoBechtel/stapigen)

(feel free to add your library by submitting a pull request)

## Development / Contributing

### Run tests

```sh
yarn run test
```

### Commit messages

This project uses semantic-release for automated release versions. So commits in this project follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) guidelines. I recommend using [commitizen](https://github.com/commitizen/cz-cli) for automated commit messages.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
