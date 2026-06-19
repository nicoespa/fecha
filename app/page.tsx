import { CreateForm } from "@/components/CreateForm";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-full">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        <Logo />
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-10 sm:pt-16 pb-10">
          {/* Hero copy */}
          <div>
            <span
              className="pill pill-mint fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--mint)" }}
              />
              en vivo, sin cuentas
            </span>

            <h1
              className="display text-[2.8rem] sm:text-[4rem] mt-5 fade-up"
              style={{ animationDelay: "40ms" }}
            >
              ¿Cuándo
              <br />
              <span style={{ color: "var(--mint)" }}>podemos</span> todos?
            </h1>

            <p
              className="text-[var(--muted)] text-lg mt-5 max-w-md fade-up"
              style={{ animationDelay: "90ms" }}
            >
              Basta de “yo puedo el jueves”, “yo el sábado no”. Mandá un link,
              cada uno pinta cuándo puede en la semana y el{" "}
              <span className="text-[var(--text)]">mejor horario aparece solo</span>
              .
            </p>

            <div
              className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-sm text-[var(--muted)] fade-up"
              style={{ animationDelay: "140ms" }}
            >
              <Feature>Se actualiza en tiempo real</Feature>
              <Feature>Sin apps ni registro</Feature>
              <Feature>Funciona en el celular</Feature>
            </div>
          </div>

          {/* Form */}
          <div>
            <CreateForm />
          </div>
        </div>

        {/* How it works */}
        <section className="py-12 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="grid sm:grid-cols-3 gap-6">
            <Step
              n="01"
              title="Creá la junta"
              body="Elegí los días y la franja horaria. Te damos un link al toque."
            />
            <Step
              n="02"
              title="Pasá el link"
              body="Cada uno entra, pone su nombre y pinta cuándo puede arrastrando."
            />
            <Step
              n="03"
              title="Mirá la magia"
              body="La grilla se ilumina donde coinciden y te marca el mejor horario."
            />
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-sm text-[var(--faint)] flex items-center justify-between">
        <span>Fecha — coordinar juntadas sin sufrir.</span>
        <span className="mono">hecho con ☕</span>
      </footer>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12.5l4 4 10-10.5"
          stroke="var(--mint)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div
        className="display text-[1.6rem] mb-2"
        style={{ color: "var(--mint)" }}
      >
        {n}
      </div>
      <h3 className="font-semibold text-[var(--text)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
    </div>
  );
}
