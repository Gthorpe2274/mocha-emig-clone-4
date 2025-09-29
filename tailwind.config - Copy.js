/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'primary': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'heading': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
