# Sistema de Facturación - Frontend

Este es el frontend del sistema de facturación construido con Next.js, Tailwind CSS y Clerk para autenticación.

## 🚀 Tecnologías Utilizadas

- **Next.js 15** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utilitario
- **Clerk** - Servicio de autenticación
- **Radix UI** - Componentes de UI headless
- **Class Variance Authority** - Utilidades para variantes de clases

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Página del dashboard
│   ├── invoices/          # Gestión de facturas
│   ├── layout.tsx         # Layout principal con ClerkProvider
│   └── page.tsx           # Página de inicio
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes de UI base
├── hooks/                # Hooks personalizados
├── lib/                  # Utilidades y configuración
├── types/                # Definiciones de tipos TypeScript
└── utils/                # Funciones utilitarias
```

## 🔧 Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

### 2. Configuración de Clerk

1. Crea una cuenta en [Clerk](https://clerk.com/)
2. Crea una nueva aplicación
3. Copia las API keys desde el dashboard
4. Pega las keys en tu archivo `.env.local`

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
