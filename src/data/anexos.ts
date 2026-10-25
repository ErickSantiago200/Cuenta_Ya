import { ClipboardCheck, FileSpreadsheet, HandCoins, Percent, Stamp, type LucideIcon } from 'lucide-react'

/** Identificadores de tipo. Deben coincidir con la lista de `storage.rules`. */
export type TipoAnexo =
  | 'seguridad-social'
  | 'estampilla'
  | 'obligacion-contraida'
  | 'retencion-fuente'
  | 'acta-informe-parcial'

export interface DefinicionAnexo {
  tipo: TipoAnexo
  titulo: string
  descripcion: string
  icono: LucideIcon
  /** Solo se exige cuando corresponde al contrato. */
  opcional?: boolean
}

// Nombres y descripciones tomados de los formatos de referencia GMFP-F-07, GC-F-14
// y el certificado de no utilización de costos y deducciones (art. 383 E.T.).
export const anexos: DefinicionAnexo[] = [
  {
    tipo: 'seguridad-social',
    titulo: 'Planilla de Seguridad Social',
    descripcion: 'Planilla de pago de los aportes a salud, pensión y ARL del periodo cobrado.',
    icono: FileSpreadsheet,
  },
  {
    tipo: 'estampilla',
    titulo: 'Estampilla',
    descripcion: 'Soporte de pago de la estampilla departamental (tipo, número y fecha de pago).',
    icono: Stamp,
    opcional: true,
  },
  {
    tipo: 'obligacion-contraida',
    titulo: 'Obligación Contraída',
    descripcion:
      'Formato GMFP-F-07: datos del contratista, valor y periodo cobrado, información del contrato (CDP y RP), cuenta bancaria y control de supervisión.',
    icono: HandCoins,
  },
  {
    tipo: 'retencion-fuente',
    titulo: 'Certificado de Retención en la Fuente',
    descripcion:
      'Certificado de no utilización de costos y deducciones asociados a rentas de trabajo (art. 383 del Estatuto Tributario), firmado bajo la gravedad de juramento.',
    icono: Percent,
  },
  {
    tipo: 'acta-informe-parcial',
    titulo: 'Acta de Informe Parcial y Supervisión',
    descripcion:
      'Formato GC-F-14: actividades realizadas en el periodo de ejecución, evidencias, balance parcial y firmas del supervisor y el contratista.',
    icono: ClipboardCheck,
  },
]
