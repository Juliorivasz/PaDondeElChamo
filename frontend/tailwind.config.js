/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'azul': {
          DEFAULT: '#546D99',
          light: '#617BA8',
          dark: '#485E84',
          darker: '#3A4B69',
        },
        'verde': {
          DEFAULT: '#6e9e6d',
          light: '#85AD85',
          dark: '#639362',
          darker: '#527A52',
        }, 
        'rojo': {
          DEFAULT: '#b65454',
          light: '#BC6262',
          dark: '#AB4949', 
          darker: '#8F3D3D',
        },
        'amarillo': {
          DEFAULT: '#FFE277',
          darker: '#C5A944',
        },
        'toggleOn': '#5ed387',        
        'toggleOff': '#ff6666'        
      },
      fontFamily: {        
        'titulo': ['"Mochiy Pop One"', '"DynaPuff"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}