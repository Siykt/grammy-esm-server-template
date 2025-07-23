// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      'no-debugger': 'off',
      'no-case-declarations': 'off',
      'ts/no-empty-interface': 'off',
      'ts/no-unused-vars': 'off',
      'ts/no-use-before-define': 'off',
      'ts/no-explicit-any': 'error',
      'ts/no-non-null-assertion': 'error',
    },
  },
  {
    ignores: ['public/**', 'prisma/generated/**'],
  },
)
