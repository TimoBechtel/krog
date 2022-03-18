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
