import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-full">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        <Logo />
      </header>
      <main className="max-w-md mx-auto px-6 pt-28 text-center">
        <div className="display text-[4rem]" style={{ color: "var(--mint)" }}>
          404
        </div>
        <h1 className="display text-2xl mt-2">Esta junta no existe</h1>
        <p className="text-[var(--muted)] mt-3">
          Puede que el link esté mal escrito o que la junta ya haya vencido.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Crear una nueva junta
        </Link>
      </main>
    </div>
  );
}
