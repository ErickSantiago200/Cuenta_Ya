import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { InformeForm } from '../../components/informes/InformeForm'
import { InformeNoEncontrado } from '../../components/informes/InformeNoEncontrado'
import { useInformes } from '../../informes/InformesContext'
import type { DatosInforme, InformeActividades } from '../../types'
import { etiquetaPeriodo } from '../../utils/informes'

function datosDe(informe: InformeActividades): DatosInforme {
  const { periodo, fechaInicio, fechaFin, actividades, observaciones } = informe
  return { periodo, fechaInicio, fechaFin, actividades, observaciones }
}

export function InformeEditar() {
  const { id = '' } = useParams()
  const { obtener, actualizarBorrador } = useInformes()
  const navigate = useNavigate()
  const informe = obtener(id)
  // Copia inicial fija: sirve para detectar cambios sin guardar.
  const [inicial] = useState(() => (informe ? datosDe(informe) : null))

  if (!informe || !inicial) return <InformeNoEncontrado />
  // Solo los borradores propios se pueden editar.
  if (informe.esDemo || informe.estado !== 'Borrador') return <Navigate to={`/informes/${id}`} replace />

  return (
    <InformeForm
      modo="editar"
      titulo={`Editar informe N.º ${informe.numero} · ${etiquetaPeriodo(informe.periodo)}`}
      inicial={inicial}
      destinoCancelar={`/informes/${id}`}
      onGuardar={(datos) => {
        actualizarBorrador(id, datos)
        navigate(`/informes/${id}`, {
          state: { mensaje: 'Borrador actualizado en memoria durante esta sesión. Se perderá al recargar la página.' },
        })
      }}
    />
  )
}
