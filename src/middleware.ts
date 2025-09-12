import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((auth, req) => {
  // Solo procesar rutas protegidas para evitar overhead
  const { pathname } = req.nextUrl;
  
  // Permitir rutas públicas sin procesamiento pesado
  if (pathname.startsWith('/sign-in') || 
      pathname.startsWith('/sign-up') || 
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/time-sync')) {
    return NextResponse.next();
  }
  
  // Para rutas protegidas, aplicar auth
  const response = NextResponse.next();
  
  // Headers de tiempo solo para debugging
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Server-Time', new Date().toISOString());
    response.headers.set('X-Timezone', 'America/Lima');
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
