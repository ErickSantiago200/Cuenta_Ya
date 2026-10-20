/**
 * Fondo institucional claro de Cuenta Ya (pantallas de acceso), hecho solo con CSS:
 * base clara, halos difuminados en azul petróleo, verde azulado y dorado, y formas abstractas sutiles.
 * Necesita un contenedor padre con `isolate` (usa -z-10).
 */
export function BrandBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas" aria-hidden="true">
      {/* Halos de color */}
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-action/15 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

      {/* Formas abstractas */}
      <div className="absolute -right-24 top-16 h-72 w-72 rotate-12 rounded-[3rem] border border-primary/10" />
      <div className="absolute -right-10 top-32 h-72 w-72 rotate-12 rounded-[3rem] border border-accent/40" />
      <div className="absolute bottom-20 left-8 h-44 w-44 -rotate-12 rounded-[2.5rem] border border-action/20" />

      {/* Trama de puntos */}
      <div className="absolute inset-0 bg-[radial-gradient(rgb(23_50_77/0.07)_1px,transparent_1px)] bg-size-[22px_22px]" />
    </div>
  )
}
