import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
    js.configs.recommended,
    {
        // Ignore patterns
        ignores: ['node_modules/**', 'dist/**', 'build/**'],
    },
    {
        files: ['**/*.js'],
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                screen: 'readonly',

                // ES2021 globals
                Promise: 'readonly',
                Symbol: 'readonly',
                Map: 'readonly',
                Set: 'readonly',
                WeakMap: 'readonly',
                WeakSet: 'readonly',
                Proxy: 'readonly',
                Reflect: 'readonly',
                BigInt: 'readonly',
            },
        },
        rules: {
            'curly': ['error', 'all'],
            'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
            'indent': ['error', 4, {
                SwitchCase: 1,
                VariableDeclarator: 1,
                outerIIFEBody: 1,
                MemberExpression: 1,
                FunctionDeclaration: { parameters: 1, body: 1 },
                FunctionExpression: { parameters: 1, body: 1 },
                CallExpression: { arguments: 1 },
                ArrayExpression: 1,
                ObjectExpression: 1,
                ImportDeclaration: 1,
                flatTernaryExpressions: true,
                ignoreComments: false,
                ignoredNodes: ['JSXElement', 'JSXElement > *'],
                offsetTernaryExpressions: true,
            }],
            'operator-linebreak': ['error', 'after', {
                overrides: {
                    '?': 'before',
                    ':': 'before',
                    '||': 'before',
                    '&&': 'before',
                },
            }],
            'multiline-ternary': ['error', 'always-multiline'],
            'no-mixed-operators': ['error', {
                groups: [
                    ['+', '-', '*', '/', '%', '**'],
                    ['&', '|', '^', '~', '<<', '>>', '>>>'],
                    ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
                    ['&&', '||'],
                    ['in', 'instanceof'],
                ],
                allowSamePrecedence: true,
            }],
            'jsdoc/check-alignment': 1,
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            'space-before-blocks': ['error', 'always'],
            'keyword-spacing': ['error', {
                before: true,
                after: true,
                overrides: {
                    else: { before: true, after: true },
                },
            }],
            'arrow-parens': ['error', 'always'],
            'max-len': ['error', { code: 160 }],
            'object-curly-spacing': ['error', 'always'],
            'comma-dangle': ['error', {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'always-multiline',
            }],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            'eol-last': ['error', 'always'],
            'no-trailing-spaces': 'error',
            'space-infix-ops': 'error',
            'space-before-function-paren': ['error', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always',
            }],
            'key-spacing': ['error', {
                beforeColon: false,
                afterColon: true,
            }],
            'comma-spacing': ['error', {
                before: false,
                after: true,
            }],
            'arrow-spacing': ['error', {
                before: true,
                after: true,
            }],
            'lines-around-comment': ['error', {
                beforeBlockComment: true,
                afterBlockComment: false,
                beforeLineComment: true,
                afterLineComment: false,
                allowBlockStart: true,
                allowBlockEnd: false,
                allowObjectStart: true,
                allowObjectEnd: false,
                allowArrayStart: true,
                allowArrayEnd: false,
            }],
            'spaced-comment': ['error', 'always', {
                line: {
                    markers: ['/'],
                    exceptions: ['-', '+'],
                },
                block: {
                    markers: ['!'],
                    exceptions: ['*'],
                    balanced: true,
                },
            }],
            'newline-before-return': ['error'],
            'padding-line-between-statements': ['error',
                { blankLine: 'always', prev: '*', next: ['continue', 'throw'] },
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: ['continue', 'throw'] },
                { blankLine: 'never', prev: ['if', 'switch'], next: ['continue', 'throw'] },
            ],
        },
    },
];