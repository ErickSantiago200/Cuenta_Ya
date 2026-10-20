import { FileSpreadsheet, HeartHandshake, PiggyBank, Receipt, type LucideIcon } from 'lucide-react'

/** Identificadores de tipo. Deben coincidir con la lista de `storage.rules`. */
export type TipoAnexo = 'seguridad-social' | 'factura-cuenta-cobro' | 'afc-fvp' | 'dependientes'

export interface DefinicionAnexo {
  tipo: TipoAnexo
  titulo: string
  icono: LucideIcon
}

export const anexos: DefinicionAnexo[] = [
  { tipo: 'seguridad-social', titulo: 'Planilla de Seguridad Social', icono: FileSpreadsheet },
  { tipo: 'factura-cuenta-cobro', titulo: 'Factura / Cuenta de Cobro', icono: Receipt },
  { tipo: 'afc-fvp', titulo: 'AFC / FVP', icono: PiggyBank },
  { tipo: 'dependientes', titulo: 'Dependientes', icono: HeartHandshake },
]
