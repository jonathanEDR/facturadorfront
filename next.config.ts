import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones básicas que SÍ funcionan
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-slot', 
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      'react-hot-toast'
      // Removido '@clerk/nextjs' para evitar conflicto
    ],
  },
  
  // Configuración correcta para Next.js 15 - REMOVIDA temporalmente
  // serverExternalPackages: ['@clerk/nextjs'],
  
  // Turbopack básico
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  
  // TypeScript y ESLint
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Optimizaciones básicas
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Imágenes
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Indicadores
  devIndicators: {
    position: 'bottom-right',
  },

  // Proxy para API calls al backend
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
