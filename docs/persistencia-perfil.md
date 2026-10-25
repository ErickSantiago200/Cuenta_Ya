# Persistencia de Mi perfil (etapa futura)

## Estado actual (prototipo)

- `PerfilProvider` (`src/perfil/PerfilProvider.tsx`) guarda el perfil, su borrador sin aplicar y la firma **solo en el estado de React**.
- Los datos se comparten entre Mi perfil y el panel principal, pero **se pierden al recargar la página o al cerrar sesión**.
- La firma se valida localmente (`validarArchivoFirma` en `src/utils/files.ts`): no se sube, no se guarda y no se aplica a documentos.
- No se usa `localStorage`, `sessionStorage` ni IndexedDB: el perfil contiene datos personales y no debe quedar en el navegador.

## Propuesta para persistir de forma segura

### 1. Datos del perfil → Cloud Firestore

- Documento por usuario: `perfiles/{uid}` con los campos de `PerfilContratista` (`src/types/index.ts`), más `actualizado` (`serverTimestamp()`).
- `PerfilContratista` incluye también los **datos del contrato para actas** (tipo y fecha de suscripción, NIT, representante legal, ordenador del gasto, supervisor, CDP/RP, anticipo, responsabilidad de IVA, modificaciones y pólizas), que se registran una vez y se reutilizan en cada Acta de Ejecución Parcial. La lista `hasOnly` de las reglas debe ampliarse con esos campos.
- El valor del contrato se guarda como número entero (pesos); las fechas como cadenas `AAAA-MM-DD` o `Timestamp`.
- Reglas sugeridas (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /perfiles/{uid} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly([
          'nombreCompleto', 'tipoIdentificacion', 'numeroIdentificacion', 'correo', 'telefono',
          'dependenciaPersonal', 'numeroContrato', 'vigencia', 'entidadContratante',
          'dependenciaContrato', 'objetoContractual', 'valorContrato', 'fechaInicio',
          'fechaTerminacion', 'actualizado'
        ])
        && request.resource.data.tipoIdentificacion in ['CC', 'CE', 'PPT', 'PA', '']
        && request.resource.data.objetoContractual.size() <= 2000;
    }
  }
}
```

- Repetir en las reglas las validaciones críticas de `validarPerfil` (`src/utils/perfil.ts`): el cliente no es una barrera de seguridad.
- Integración: `PerfilProvider` cargaría `perfiles/{uid}` al iniciar sesión (estado `cargando`) y `aplicarPerfil` haría `setDoc(..., { merge: true })`, mostrando «Guardado» **solo** cuando Firestore confirme la escritura.

### 2. Firma → Firebase Storage (requiere plan Blaze)

- Ruta privada: `usuarios/{uid}/firma/archivo`, con reglas equivalentes a `storage.rules` (solo el propietario; PDF/PNG/JPEG; ≤ 10 MB).
- No generar URLs de descarga públicas (`getDownloadURL` crea enlaces accesibles para cualquiera que los tenga). Para previsualizar, usar `getBlob` con CORS configurado en el bucket.
- Definir antes cómo y dónde se aplicará la firma a documentos (formato, posición, validez).

### 3. Consideraciones de datos personales

- El perfil contiene datos personales (identificación, teléfono, correo, firma). Aplica la Ley 1581 de 2012 (habeas data): definir la finalidad del tratamiento, la autorización del titular y la política de privacidad antes de almacenarlos.
- Limitar el acceso al propio usuario; cualquier acceso de supervisores requerirá roles explícitos (custom claims) y reglas específicas.

## Servicios que requieren confirmación

- Activar **Cloud Firestore** (el plan Spark tiene cuota gratuita) y desplegar `firestore.rules`.
- Activar **Firebase Storage** solo si se aprueba el plan Blaze.
