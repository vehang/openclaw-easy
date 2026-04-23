/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // iOS Safari 兼容性优化
      screens: {
        'ios': { 'raw': '(max-device-width: 896px) and (-webkit-min-device-pixel-ratio: 2)' },
        'iphone': { 'raw': '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)', 
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-ios': '-webkit-fill-available',
      },
      keyframes: {
        'fade-in': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(-10px)',
            '-webkit-transform': 'translateY(-10px)'
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)',
            '-webkit-transform': 'translateY(0)'
          }
        },
        // iOS Safari 优化的动画
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            '-webkit-transform': 'translateY(100%)'
          },
          '100%': {
            transform: 'translateY(0)',
            '-webkit-transform': 'translateY(0)'
          }
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'progress': 'progress 1s ease-in-out infinite'
      },
      fontFamily: {
        'system': [
          '-apple-system',
          'BlinkMacSystemFont', 
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      animationDelay: {
        '150': '150ms',
        '300': '300ms',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // 添加iOS Safari兼容性插件
    function({ addUtilities, addBase }) {
      addBase({
        // iOS Safari 基础样式
        'html': {
          '-webkit-text-size-adjust': '100%',
          'text-size-adjust': '100%',
        },
        'body': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        '*': {
          'box-sizing': 'border-box',
          '-webkit-box-sizing': 'border-box',
        }
      });
      
      addUtilities({
        // iOS Safari 特定工具类
        '.webkit-touch-scroll': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.webkit-appearance-none': {
          '-webkit-appearance': 'none',
          'appearance': 'none',
        },
        '.webkit-tap-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.webkit-no-callout': {
          '-webkit-touch-callout': 'none',
        },
        '.webkit-no-select': {
          '-webkit-user-select': 'none',
          'user-select': 'none',
        },
        '.ios-safe-area': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.min-h-screen-ios': {
          'min-height': '100vh',
          'min-height': '-webkit-fill-available',
        },
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
      });
    }
  ],
}