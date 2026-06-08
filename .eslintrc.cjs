module.exports = {
	root: true,
	ignorePatterns: ['dist', '.next', 'coverage', 'node_modules'],
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint'],
			extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
			},
			rules: {
				'@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-misused-promises': 'error',
			},
		},
	],
};
