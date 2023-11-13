import { expect, test } from 'bun:test';
import { createHooks, type Hook } from '.';

test('can wrap a function', async () => {
  const hooks = createHooks<{
    'before:concat': Hook<string[], { toUpper: (v: string) => string }>;
  }>();

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function concatStrings(...strings: string[]): string {
    return strings.join(' ');
  }

  hooks.register('before:concat', (args, { toUpper }) => {
    return args.map(toUpper);
  });

  const createConcatStringWithContext = hooks.wrap(
    'before:concat',
    concatStrings,
  );

  const wrappedConcatString = createConcatStringWithContext({
    toUpper: (v) => v.toUpperCase(),
  });

  expect(await wrappedConcatString('hello', 'world')).toBe('HELLO WORLD');
});
