import { FirebaseError } from 'firebase/app'
import {
  deleteObject,
  getMetadata,
  ref,
  uploadBytesResumable,
  type FullMetadata,
  type StorageReference,
  type UploadTask,
} from 'firebase/storage'
import type { TipoAnexo } from '../data/anexos'
import { storage } from '../lib/firebase'
import { isStorageError, STORAGE_NOT_CONFIGURED } from './storageErrors'

/** Documento guardado en Firebase Storage, tal como lo muestra la interfaz. */
export interface AnexoGuardado {
  nombre: string
  tamano: number
  contentType: string
  actualizado: Date
}

/**
 * Ruta privada del documento: usuarios/{uid}/anexos/{tipo}/documento.
 * Un archivo por tipo; reemplazar sobrescribe el anterior. El nombre original se guarda en los metadatos.
 */
function anexoRef(uid: string, tipo: TipoAnexo): StorageReference {
  if (!storage) {
    throw new FirebaseError(STORAGE_NOT_CONFIGURED, 'Firebase Storage no está configurado')
  }
  return ref(storage, `usuarios/${uid}/anexos/${tipo}/documento`)
}

export function toAnexoGuardado(metadata: FullMetadata): AnexoGuardado {
  return {
    nombre: metadata.customMetadata?.nombreOriginal ?? 'documento',
    tamano: metadata.size,
    contentType: metadata.contentType ?? '',
    actualizado: new Date(metadata.updated),
  }
}

/** Devuelve el documento guardado, o `null` si el usuario aún no lo ha cargado. */
export async function obtenerAnexo(uid: string, tipo: TipoAnexo): Promise<AnexoGuardado | null> {
  try {
    return toAnexoGuardado(await getMetadata(anexoRef(uid, tipo)))
  } catch (error) {
    if (isStorageError(error, 'storage/object-not-found')) return null
    throw error
  }
}

/** Inicia la carga (con progreso y cancelación). El archivo anterior se conserva si la carga falla. */
export function subirAnexo(uid: string, tipo: TipoAnexo, file: File, contentType: string): UploadTask {
  return uploadBytesResumable(anexoRef(uid, tipo), file, {
    contentType,
    customMetadata: { nombreOriginal: file.name },
  })
}

export async function eliminarAnexo(uid: string, tipo: TipoAnexo): Promise<void> {
  try {
    await deleteObject(anexoRef(uid, tipo))
  } catch (error) {
    // Si ya no existe, el resultado es el mismo que eliminarlo.
    if (!isStorageError(error, 'storage/object-not-found')) throw error
  }
}
