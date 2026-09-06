/**
 * Tailwind CSS and Material Tailwind Theme Configuration
 * 
 * RESPONSIBILITY:
 * Defines content scanning paths, theme extensions, custom color palettes,
 * and integrates Material Tailwind component styling utilities.
 * 
 * NOT RESPONSIBLE FOR:
 * CSS reset declarations or direct DOM styling.
 */

import withMT from '@material-tailwind/react/utils/withMT';

// Keep every semantic utility color in the same neutral scale for the product-wide theme.
const monochrome = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#71717a',
  500: '#52525b',
  600: '#3f3f46',
  700: '#27272a',
  800: '#18181b',
  900: '#09090b'
};

export default withMT({
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          500: '#52525b',
          600: '#27272a',
          700: '#18181b'
        },
        indigo: monochrome,
        purple: monochrome,
        violet: monochrome,
        blue: monochrome,
        sky: monochrome,
        cyan: monochrome,
        teal: monochrome,
        emerald: monochrome,
        green: monochrome,
        amber: monochrome,
        orange: monochrome,
        red: monochrome,
        'blue-gray': monochrome
      }
    }
  },
  plugins: []
});
