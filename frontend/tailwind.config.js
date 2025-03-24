/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // src 폴더 내 모든 JS/JSX/TS/TSX 파일에서 Tailwind 클래스 감지
  theme: {
    extend: {}, // 필요하면 커스텀 스타일 추가
  },
  plugins: [],
};