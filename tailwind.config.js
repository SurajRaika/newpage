/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue,svelte}', // adjust to your file types
  ],
              darkMode: 'class', // Enable dark mode based on 'dark' class on html element

  theme: {
    extend: {
      colors: {
        brandBlue: '#1E40AF', // your custom color name and value
      },
    },
  },
  plugins: [],
}
