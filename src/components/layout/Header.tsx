import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Navigation } from "./Navigation";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Facturador
              </h1>
            </Link>
            <Navigation />
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Iniciar Sesión
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Registrarse
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              {/* UserButton removido - el usuario se maneja desde el Sidebar */}
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
