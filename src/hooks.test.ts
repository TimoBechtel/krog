import { createHooks, Hook } from '.';

test('allows registering hooks', (done) => {
	const hooks = createHooks<{
		'my-hook': Hook<string, { id: string }>;
	}>();

	const testArgs = 'my-args';
	const testContext = { id: 'my-id' };

	hooks.register('my-hook', (args, context) => {
		expect(args).toBe(testArgs);
		expect(context).toBe(testContext);
		done();
	});

	hooks.call('my-hook', { args: testArgs, context: testContext });
});

test('allow registering multiple hooks at once', () => {
	const hooks = createHooks<{
		'my-hook': Hook<string, { id: string }>;
		'my-hook-2': Hook<string, { id: string }>;
	}>();

	const testArgs = 'my-args';
	const testContext = { id: 'my-id' };

	hooks.registerMany({
		'my-hook': (args, context) => {
			expect(args).toBe(testArgs);
			expect(context).toBe(testContext);
		},
		'my-hook-2': (args, context) => {
			expect(args).toBe(testArgs);
			expect(context).toBe(testContext);
		},
	});

	hooks.call('my-hook', { args: testArgs, context: testContext });
});

test('allows manipulating arguments', async () => {
	const hooks = createHooks<{
		'my-hook': Hook<string, void>;
	}>();

	const testArgsInput = 'my-args';
	const testArgsOutput = 'MY-ARGS';

	hooks.register('my-hook', (args) => {
		return args.toUpperCase();
	});

	const result = await hooks.call('my-hook', { args: testArgsInput });
	expect(result).toBe(testArgsOutput);
});

test('arguments are cloned by default', async () => {
	type Hooks = {
		'test:hook': Hook<{ data: { message: string } }>;
	};
	const hooks = createHooks<Hooks>();
	const exampleData = { data: { message: 'hello world' } };

	hooks.register('test:hook', ({ data }) => {
		expect(data.message).toEqual('hello world');
		expect(data).not.toBe(exampleData.data);
	});

	await hooks.call('test:hook', { args: exampleData });
});

test('allow cancelling hook with error message', (done) => {
	type Hooks = {
		'test:hook': Hook<{ message: string }>;
	};
	const hooks = createHooks<Hooks>();
	let hookTriggered = false;

	hooks.register('test:hook', ({ message }) => {
		expect(message).toEqual('hello world');
		throw new Error('hook failed');
	});
	hooks
		.call('test:hook', { args: { message: 'hello world' } })
		.then(() => {
			hookTriggered = true;
		})
		.catch(({ message }) => {
			expect(message).toEqual('hook failed');
		});

	setTimeout(() => {
		expect(hookTriggered).toBe(false);
		done();
	}, 10);
});

test('allow asynchronous functions as middleware', (done) => {
	type Hooks = {
		'test:hook': Hook<{ data: any }>;
	};
	const hooks = createHooks<Hooks>();

	hooks.register('test:hook', async (data) => {
		expect(data).toEqual(undefined);
		return {
			data: 'hello world',
		};
	});
	hooks.register('test:hook', (data) => {
		expect(data).toEqual({ data: 'hello world' });
		done();
	});
	hooks.call('test:hook');
});

it('should unregister a specific hook', async () => {
	const hooks = createHooks<{
		'test:hook': Hook<number, void>;
	}>();

	hooks.register('test:hook', (value) => {
		return value * 2;
	});
	const unregisterTestHook2 = hooks.register('test:hook', (value) => {
		return value * 3;
	});

	let result = await hooks.call('test:hook', { args: 1 });
	expect(result).toEqual(6);

	// Unregister testHook2 and call the hooks again
	unregisterTestHook2();
	result = await hooks.call('test:hook', { args: 1 });
	expect(result).toEqual(2);
});

it('should unregister all hooks for a given name', async () => {
	const hooks = createHooks<{
		'test:hook': Hook<number, void>;
	}>();

	hooks.register('test:hook', (value) => {
		return value * 2;
	});
	hooks.register('test:hook', (value) => {
		return value * 3;
	});

	let result = await hooks.call('test:hook', { args: 1 });
	expect(result).toEqual(6);

	// Unregister all hooks for 'test:hook' and call the hooks again
	hooks.unregister('test:hook');
	result = await hooks.call('test:hook', { args: 1 });
	expect(result).toEqual(1);
});
