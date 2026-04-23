/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // iOS Safari 兼容性配置
      overrideBrowserslist: [
        'iOS >= 12',
        'Safari >= 12',
        'last 4 versions',
        '> 1%',
        'not dead'
      ],
      // 确保添加webkit前缀
      flexbox: 'no-2009',
      grid: 'autoplace'
    },
  },
};

export default config;
