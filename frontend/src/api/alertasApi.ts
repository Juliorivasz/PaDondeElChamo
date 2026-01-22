import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { AlertaInventario } from '../types/dto/Alertas'

/**
 * Suscribe a las alertas de inventario en tiempo real
 */
export const suscribirAlertasInventario = (callback: (alertas: AlertaInventario[]) => void): (() => void) => {
  let alertasProductos: AlertaInventario[] = []
  let alertasInsumos: AlertaInventario[] = []

  const notificar = () => {
    const todas = [...alertasProductos, ...alertasInsumos]
    callback(todas.sort((a, b) => {
      const orden = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 }
      return orden[a.severidad] - orden[b.severidad]
    }))
  }

  // Suscripción a Productos
  const unsubscribeProductos = onSnapshot(collection(db, 'productos'), (snapshot) => {
    alertasProductos = snapshot.docs.map(doc => {
      const producto = doc.data()
      const id = doc.id
      const nombre = producto.nombre || 'Producto sin nombre'
      const stock = producto.stock ?? 0
      const stockMinimo = producto.stockMinimo ?? 5
      const precio = producto.precio ?? 0
      const costo = producto.costo ?? 0
      
      const alertasItem: AlertaInventario[] = []

      if (stock < 0) {
        alertasItem.push({
          id: `${id}-stock-negativo`,
          tipo: 'STOCK_NEGATIVO',
          severidad: 'CRITICA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Stock negativo: ${stock} unidades`,
          valorActual: stock,
          valorEsperado: 0,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      if (stock > 0 && stock <= stockMinimo) {
        alertasItem.push({
          id: `${id}-stock-bajo`,
          tipo: 'STOCK_BAJO',
          severidad: 'MEDIA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Stock bajo: ${stock} unidades (mínimo: ${stockMinimo})`,
          valorActual: stock,
          valorEsperado: stockMinimo,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      return alertasItem
    }).flat()
    
    notificar()
  })

  // Suscripción a Insumos
  const unsubscribeInsumos = onSnapshot(collection(db, 'insumos'), (snapshot) => {
    alertasInsumos = snapshot.docs.map(doc => {
      const insumo = doc.data()
      const id = doc.id
      const nombre = insumo.nombre || 'Insumo sin nombre'
      const stock = insumo.stock ?? 0
      const stockMinimo = insumo.stockMinimo ?? 5
      
      const alertasItem: AlertaInventario[] = []

      if (stock <= stockMinimo) {
        alertasItem.push({
          id: `${id}-insumo-bajo`,
          tipo: 'STOCK_BAJO',
          severidad: stock <= 0 ? 'CRITICA' : 'MEDIA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Insumo bajo: ${stock} ${insumo.unidadMedida || ''}`,
          valorActual: stock,
          valorEsperado: stockMinimo,
          fechaDeteccion: new Date(),
          origen: 'INSUMO'
        })
      }
      return alertasItem
    }).flat()

    notificar()
  })

  return () => {
    unsubscribeProductos()
    unsubscribeInsumos()
  }
}

/**
 * Obtiene todas las alertas de inventario detectando inconsistencias en productos
 */
export const obtenerAlertasInventario = async (): Promise<AlertaInventario[]> => {
  try {
    const productosSnapshot = await getDocs(collection(db, 'productos'))
    const alertas: AlertaInventario[] = []

    productosSnapshot.docs.forEach(doc => {
      const producto = doc.data()
      const id = doc.id
      const nombre = producto.nombre || 'Producto sin nombre'
      const stock = producto.stock ?? 0
      const precio = producto.precio ?? 0
      const costo = producto.costo ?? 0
      const stockMinimo = producto.stockMinimo ?? 5

      // 1. CRÍTICA: Stock negativo
      if (stock < 0) {
        alertas.push({
          id: `${id}-stock-negativo`,
          tipo: 'STOCK_NEGATIVO',
          severidad: 'CRITICA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Stock negativo: ${stock} unidades`,
          valorActual: stock,
          valorEsperado: 0,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      // 2. ALTA: Sin precio
      if (precio === 0 || precio === null || precio === undefined) {
        alertas.push({
          id: `${id}-sin-precio`,
          tipo: 'SIN_PRECIO',
          severidad: 'ALTA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: 'Producto sin precio de venta definido',
          valorActual: precio,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      // 3. ALTA: Sin costo
      if (costo === 0 || costo === null || costo === undefined) {
        alertas.push({
          id: `${id}-sin-costo`,
          tipo: 'SIN_COSTO',
          severidad: 'ALTA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: 'Producto sin costo definido',
          valorActual: costo,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      // 4. ALTA: Precio menor que costo (posible pérdida)
      if (precio > 0 && costo > 0 && precio < costo) {
        alertas.push({
          id: `${id}-precio-menor-costo`,
          tipo: 'PRECIO_MENOR_COSTO',
          severidad: 'ALTA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Precio ($${precio}) es menor que el costo ($${costo})`,
          valorActual: precio,
          valorEsperado: costo,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }

      // 5. MEDIA: Stock bajo
      if (stock > 0 && stock <= stockMinimo) {
        alertas.push({
          id: `${id}-stock-bajo`,
          tipo: 'STOCK_BAJO',
          severidad: 'MEDIA',
          idProducto: id,
          nombreProducto: nombre,
          mensaje: `Stock bajo: ${stock} unidades (mínimo: ${stockMinimo})`,
          valorActual: stock,
          valorEsperado: stockMinimo,
          fechaDeteccion: new Date(),
          origen: 'PRODUCTO'
        })
      }
    })

    // Ordenar por severidad: CRITICA > ALTA > MEDIA > BAJA
    const ordenSeveridad = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 }
    alertas.sort((a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad])

    return alertas
  } catch (error) {
    console.error('Error al obtener alertas de inventario:', error)
    return []
  }
}
