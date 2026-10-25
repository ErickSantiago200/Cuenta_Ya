import type { TipoIdentificacion } from '../types'

export const TIPOS_IDENTIFICACION: { valor: TipoIdentificacion; etiqueta: string }[] = [
  { valor: 'CC', etiqueta: 'Cédula de ciudadanía' },
  { valor: 'CE', etiqueta: 'Cédula de extranjería' },
  { valor: 'PPT', etiqueta: 'Permiso por Protección Temporal' },
  { valor: 'PA', etiqueta: 'Pasaporte' },
]
