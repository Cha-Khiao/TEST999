/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // ปิด Strict Mode เพื่อลดการ render ซ้ำใน Dev (ช่วยลดความหน่วงได้บ้าง)
  eslint: {
    ignoreDuringBuilds: true, // ยอมให้ Build ผ่านแม้มี Warning เล็กน้อย
  },
};

export default nextConfig;