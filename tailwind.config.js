/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float-delayed 8s ease-in-out infinite 1s',
                'scan': 'scan 8s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(12deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(12deg)' },
                },
                'float-delayed': {
                    '0%, 100%': { transform: 'translateY(0) rotate(-12deg)' },
                    '50%': { transform: 'translateY(-30px) rotate(-12deg)' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                }
            }
        },
    },
    plugins: [],
}
