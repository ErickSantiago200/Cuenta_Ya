import { useState } from 'react'
import { useNavigate } from 'react-router'
import { InformeForm } from '../../components/informes/InformeForm'
import { useInformes } from '../../informes/InformesContext'
import { datosVacios } from '../../utils/informes'

export function InformeNuevo() {
  const { crearBorrador } = useInformes()
  const navigate = useNavigate()
  const [inicial] = useState(datosVacios)

  return (
    <InformeForm
      modo="crear"
      titulo="Crear informe"
      inicial={inicial}
      destinoCancelar="/informes"
      onGuardar={(datos) => {
        const informe = crearBorrador(datos)
        navigate(`/informes/${informe.id}`, {
          state: { mensaje: 'Borrador creado en memoria durante esta sesión. Se perderá al recargar la página.' },
        })
      }}
    />
  )
}
