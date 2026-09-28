/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Tema claro de alto contraste para uso sob sol forte.
      colors: {
        fundo: '#FFFFFF',
        superficie: '#F2F4F3',
        borda: '#5C6360',
        texto: '#111412',
        'texto-suave': '#3D4441',
        primaria: {
          DEFAULT: '#0B5D1E',
          escura: '#073F14',
          contraste: '#FFFFFF',
        },
        perigo: {
          DEFAULT: '#A4161A',
          fundo: '#FDE8E8',
        },
        atencao: {
          DEFAULT: '#7A4A00',
          fundo: '#FFF1CC',
        },
        info: {
          DEFAULT: '#0B3D91',
          fundo: '#E3ECFB',
        },
        sucesso: {
          DEFAULT: '#0B5D1E',
          fundo: '#E2F3E6',
        },
      },
      fontSize: {
        base: ['18px', '26px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['28px', '36px'],
      },
      minHeight: {
        toque: '56px',
      },
    },
  },
  plugins: [],
};
