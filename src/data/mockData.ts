// Menú lateral y datos de DEMOSTRACIÓN para maquetar la interfaz. No representan cálculos reales.
import {
  Archive,
  Award,
  Calculator,
  FileText,
  FolderOpen,
  House,
  Paperclip,
  ScrollText,
} from 'lucide-react'
import type { ItemMenu, ResumenInforme } from '../types'

export const itemsMenu: ItemMenu[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: House, ruta: '/' },
  { id: 'informes', etiqueta: 'Informes', icono: FileText, ruta: '/informes' },
  { id: 'contrato', etiqueta: 'Contrato', icono: ScrollText },
  { id: 'anexos', etiqueta: 'Documentos Anexos', icono: Paperclip, ruta: '/documentos-anexos' },
  { id: 'ibc', etiqueta: 'Calculadora IBC', icono: Calculator },
  { id: 'certificaciones', etiqueta: 'Certificaciones', icono: Award },
  { id: 'gestor', etiqueta: 'Gestor de Documentos', icono: FolderOpen },
  { id: 'expediente', etiqueta: 'Expediente Final', icono: Archive },
]

// Resumen de DEMOSTRACIÓN para el panel principal (no son informes reales).
export const resumenInformesDemo: ResumenInforme[] = [
  { id: 1, numero: 1, periodo: 'Febrero 2026', fechaEnvio: '05/03/2026', valor: '$ 4.000.000', estado: 'Aprobado' },
  { id: 2, numero: 2, periodo: 'Marzo 2026', fechaEnvio: '06/04/2026', valor: '$ 4.000.000', estado: 'Aprobado' },
  { id: 3, numero: 3, periodo: 'Abril 2026', fechaEnvio: '05/05/2026', valor: '$ 4.000.000', estado: 'En revisión' },
  { id: 4, numero: 4, periodo: 'Mayo 2026', fechaEnvio: null, valor: '$ 4.000.000', estado: 'Pendiente' },
  { id: 5, numero: 5, periodo: 'Junio 2026', fechaEnvio: null, valor: '$ 4.000.000', estado: 'Pendiente' },
  { id: 6, numero: 6, periodo: 'Julio 2026', fechaEnvio: null, valor: '$ 4.000.000', estado: 'Pendiente' },
]
