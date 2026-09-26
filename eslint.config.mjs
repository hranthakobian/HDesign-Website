import nextConfig from 'eslint-config-next';

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default eslintConfig;
