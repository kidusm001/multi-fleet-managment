module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  rules: {
  // Disable Fast Refresh constraint during migration
  'react-refresh/only-export-components': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  // Silence noisy rules during migration; we'll re-tighten later
  'no-unused-vars': 'off',
  'react/no-unescaped-entities': 'off',
  'react-hooks/exhaustive-deps': 'off',
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.*'],
      env: { jest: true, node: true, browser: true },
      rules: {
        'no-undef': 'off'
      }
    }
  ]
}
