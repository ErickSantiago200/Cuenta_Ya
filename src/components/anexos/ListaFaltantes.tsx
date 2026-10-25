interface ListaFaltantesProps {
  mensajes: string[]
  /** Máximo de mensajes visibles; el resto se resume. */
  max?: number
}

/** Lista compacta de datos que faltan o deben corregirse. */
export function ListaFaltantes({ mensajes, max = 8 }: ListaFaltantesProps) {
  const visibles = mensajes.slice(0, max)
  const resto = mensajes.length - visibles.length
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {visibles.map((m) => (
        <li key={m}>{m}</li>
      ))}
      {resto > 0 && <li>Y {resto} {resto === 1 ? 'dato más' : 'datos más'}.</li>}
    </ul>
  )
}
