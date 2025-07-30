/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class', // Enable dark mode based on 'dark' class on html element
  theme: {
                extend: {
                    colors: {
                        // Default (Light) Mode Colors
                        'primary-bg': '#f0f0f0',
                        'secondary-bg': '#e0e0e0',
                        'border-color': '#bbbbbb',
                        'text-primary': '#1a1a1a',
                        'text-secondary': '#444444',
                        'text-placeholder': '#777777',
                        'accent': '#888888', // Light mode accent/focus
                        'radio-selected-bg': '#dddddd',
                        'radio-selected-dot': '#1a1a1a',

                        // Dark Mode Overrides (used with dark: prefix)
                        dark: {
                            'primary-bg': '#1a1a1a',
                            'secondary-bg': '#2a2a2a',
                            'border-color': '#444444',
                            'text-primary': '#f0f0f0',
                            'text-secondary': '#cccccc',
                            'text-placeholder': '#888888',
                            'accent': '#ffffff', // Dark mode accent/focus
                            'radio-selected-bg': '#555555',
                            'radio-selected-dot': '#ffffff',
                        },
                    },
                    transitionProperty: {
                        'all': 'all',
                    },
                    transitionTimingFunction: {
                        'ease-out': 'ease-out',
                    },
                    transitionDuration: {
                        '200': '0.2s',
                        '300': '0.3s',
                        '400': '0.4s',
                        '50': '0.05s',
                    },
                    animation: {
                        'slide-fade': 'slide-fade 1s infinite cubic-bezier(0.65, 0.05, 0.36, 1)',
                    },
                    keyframes: {
                        'slide-fade': {
                            '0%': { opacity: '0', transform: 'translateX(-50px)' },
                            '25%': { opacity: '1', transform: 'translateX(0)' },
                            '75%': { opacity: '1', transform: 'translateX(50px)' },
                            '100%': { opacity: '0', transform: 'translateX(100px)' },
                        }
                    },
                    fontFamily: {
                        // Add 'Schoolbell' to the extended font families
                        'schoolbell': ['"Schoolbell"', 'cursive'],
                        'inter': ['Inter', 'sans-serif'], // Keep Inter if it's the default
                    }
                }
            },
	plugins: [],
}


/**
   tailwind.config = {
            darkMode: 'class', // Enable dark mode based on 'dark' class on html element
            theme: {
                extend: {
                    colors: {
                        // Default (Light) Mode Colors
                        'primary-bg': '#f0f0f0',
                        'secondary-bg': '#e0e0e0',
                        'border-color': '#bbbbbb',
                        'text-primary': '#1a1a1a',
                        'text-secondary': '#444444',
                        'text-placeholder': '#777777',
                        'accent': '#888888', // Light mode accent/focus
                        'radio-selected-bg': '#dddddd',
                        'radio-selected-dot': '#1a1a1a',

                        // Dark Mode Overrides (used with dark: prefix)
                        dark: {
                            'primary-bg': '#1a1a1a',
                            'secondary-bg': '#2a2a2a',
                            'border-color': '#444444',
                            'text-primary': '#f0f0f0',
                            'text-secondary': '#cccccc',
                            'text-placeholder': '#888888',
                            'accent': '#ffffff', // Dark mode accent/focus
                            'radio-selected-bg': '#555555',
                            'radio-selected-dot': '#ffffff',
                        },
                    },
                    transitionProperty: {
                        'all': 'all',
                    },
                    transitionTimingFunction: {
                        'ease-out': 'ease-out',
                    },
                    transitionDuration: {
                        '200': '0.2s',
                        '300': '0.3s',
                        '400': '0.4s',
                        '50': '0.05s',
                    },
                    animation: {
                        'slide-fade': 'slide-fade 1s infinite cubic-bezier(0.65, 0.05, 0.36, 1)',
                    },
                    keyframes: {
                        'slide-fade': {
                            '0%': { opacity: '0', transform: 'translateX(-50px)' },
                            '25%': { opacity: '1', transform: 'translateX(0)' },
                            '75%': { opacity: '1', transform: 'translateX(50px)' },
                            '100%': { opacity: '0', transform: 'translateX(100px)' },
                        }
                    },
                    fontFamily: {
                        // Add 'Schoolbell' to the extended font families
                        'schoolbell': ['"Schoolbell"', 'cursive'],
                        'inter': ['Inter', 'sans-serif'], // Keep Inter if it's the default
                    }
                }
            }
        }
			*/