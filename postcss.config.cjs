module.exports = {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {},
      ...(import.meta.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
    }
  };