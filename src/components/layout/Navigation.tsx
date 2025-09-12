"use client";

import { SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Facturas', href: '/facturas' },
  { name: 'Diseñador', href: '/diseno-invoice' },
  { name: 'Auditoría SUNAT', href: '/auditoria' },
  { name: 'Ayuda SUNAT', href: '/ayuda-sunat' },
  { name: 'Clientes', href: '/clients' },
  { name: 'Productos', href: '/products' },
  { name: 'Certificados', href: '/certificates' },
  { name: 'Reportes', href: '/reports' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <SignedIn>
      <nav className="hidden md:flex space-x-8">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-black"
                : "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </SignedIn>
  );
}
