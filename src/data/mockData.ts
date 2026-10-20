// Datos ficticios solo para maquetar la interfaz. No representan cálculos reales.
import {
  Archive,
  Award,
  Calculator,
  CalendarCheck,
  FileText,
  FolderOpen,
  House,
  Paperclip,
  ScrollText,
  Send,
  Wallet,
} from 'lucide-react'
import type { Indicador, ItemMenu, ResumenInforme } from '../types'

// El nombre del usuario viene de la sesión real (Firebase); el contrato sigue siendo de ejemplo.
export const contratoEjemplo = 'Contrato N.º 1234 de 2026'

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

export const indicadores: Indicador[] = [
  {
    id: 'valor',
    titulo: 'Valor del contrato',
    valor: '$ 24.000.000',
    detalle: 'Valor total pactado',
    icono: Wallet,
  },
  {
    id: 'pagos',
    titulo: 'Pagos planeados',
    valor: '6',
    detalle: 'Cuentas de cobro programadas',
    icono: CalendarCheck,
  },
  {
    id: 'enviados',
    titulo: 'Informes enviados',
    valor: '3',
    detalle: 'De 6 informes previstos',
    icono: Send,
  },
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
