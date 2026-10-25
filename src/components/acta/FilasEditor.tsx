import { Plus, Trash2 } from 'lucide-react'
import type { Errores } from '../../utils/soportes'
import { formatearCOP, soloDigitos } from '../../utils/perfil'
import { TextField } from '../auth/TextField'
import { Button } from '../ui/Button'

export interface Columna<T> {
  campo: Exclude<keyof T, 'id'> & string
  etiqueta: string
  tipo?: 'texto' | 'fecha' | 'pesos'
  placeholder?: string
}

interface FilasEditorProps<T extends { id: string }> {
  titulo: string
  filas: T[]
  columnas: Columna<T>[]
  nueva: () => T
  onChange: (filas: T[]) => void
  errores: Errores
  mostrarErrores: boolean
  max: number
}

/** Lista de registros opcionales («No aplica» mientras esté vacía). */
export function FilasEditor<T extends { id: string }>({
  titulo,
  filas,
  columnas,
  nueva,
  onChange,
  errores,
  mostrarErrores,
  max,
}: FilasEditorProps<T>) {
  const valor = (fila: T, campo: string) => String((fila as Record<string, unknown>)[campo] ?? '')

  function cambiar(id: string, columna: Columna<T>, texto: string) {
    const limpio = columna.tipo === 'pesos' ? soloDigitos(texto) : texto
    onChange(filas.map((f) => (f.id === id ? { ...f, [columna.campo]: limpio } : f)))
  }

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">
          {titulo} {filas.length === 0 && <span className="font-normal text-ink-muted">· No aplica</span>}
        </h3>
        <Button variant="secondary" size="sm" onClick={() => onChange([...filas, nueva()])} disabled={filas.length >= max}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar
        </Button>
      </div>

      {filas.map((fila, i) => (
        <div key={fila.id} className="mt-3 border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Registro {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(filas.filter((f) => f.id !== fila.id))} aria-label={`Quitar registro ${i + 1} de ${titulo}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {columnas.map((c) => {
              const v = valor(fila, c.campo)
              const clave = `${fila.id}.${c.campo}`
              return (
                <TextField
                  key={c.campo}
                  label={c.etiqueta}
                  required
                  type={c.tipo === 'fecha' ? 'date' : 'text'}
                  inputMode={c.tipo === 'pesos' ? 'numeric' : undefined}
                  placeholder={c.placeholder}
                  value={v}
                  onChange={(e) => cambiar(fila.id, c, e.target.value)}
                  error={mostrarErrores || v !== '' ? errores[clave] : undefined}
                  hint={c.tipo === 'pesos' && v && !errores[clave] ? formatearCOP(v) : undefined}
                />
              )
            })}
          </div>
        </div>
      ))}
      {filas.length >= max && <p className="mt-2 text-xs text-ink-muted">Máximo {max} registros.</p>}
    </div>
  )
}
