import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  /*
   * `next lint` supplied this ignore list and Next 16 removed that command, so
   * the config has to state it. ESLint 9 ignores node_modules on its own but
   * not build output: without this, linting the project means linting every
   * generated chunk in .next — 12,229 problems, none of them ours.
   */
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
