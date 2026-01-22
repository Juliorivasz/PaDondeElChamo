import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CompraDTO, PaginaDeCompras, Compra } from "../types/dto/Compra";

// Obtener compras con filtros básicos (sin paginación compleja por ahora)
export const obtenerCompras = async (filtros: any): Promise<PaginaDeCompras> => {
  try {
    // Fetch más datos de los necesarios para poder filtrar en cliente
    const fetchLimit = (filtros.tamaño || 20) * 5;
    
    // Query simple sin where para evitar índices compuestos
    let q = query(
      collection(db, 'compras'), 
      orderBy('fechaHora', 'desc'),
      limit(fetchLimit)
    );
    
    const snapshot = await getDocs(q);
    
    // Mapeo manual
    let compras: Compra[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        idCompra: doc.id as any,
        total: data.total,
        fechaHora: (data.fechaHora as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        proveedor: data.nombreProveedor || 'Desconocido',
        usuario: data.nombreUsuario || 'Sistema',
        estadoCompra: data.estado,
        detalles: data.detalles.map((d: any) => ({
          idProducto: d.idItem,
          producto: d.nombre,
          tipo: d.tipo || 'PRODUCTO',
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitario
        }))
      };
    });

    // CLIENT-SIDE FILTERING
    
    // Filter by proveedor (need to check against idProveedor in original data)
    if (filtros.idProveedor) {
      compras = compras.filter((c, index) => {
        const docData = snapshot.docs[index]?.data();
        return docData?.idProveedor === filtros.idProveedor;
      });
    }
    
    // Filter by date range
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      compras = compras.filter(c => new Date(c.fechaHora) >= fechaInicio);
    }
    
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      compras = compras.filter(c => new Date(c.fechaHora) <= fechaFin);
    }
    
    // Filter by user
    if (filtros.idUsuario) {
      compras = compras.filter(c => c.usuario.includes(filtros.idUsuario.toString()));
    }

    // PAGINATION
    const totalElements = compras.length;
    const pageSize = filtros.tamaño || 10;
    const currentPage = filtros.pagina || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = compras.slice(startIndex, endIndex);

    return {
      content: paginatedContent,
      totalPages,
      totalElements,
      number: currentPage,
      size: pageSize
    };
  } catch (error) {
    console.error("Error al obtener compras:", error);
    return { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 };
  }
}

export const crearCompra = async (data: CompraDTO): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      let totalCompra = 0;
      const detallesProcesados: any[] = [];
      const proveedorRef = doc(db, 'proveedores', data.idProveedor);
      const proveedorDoc = await transaction.get(proveedorRef);
      
      if (!proveedorDoc.exists()) throw new Error("Proveedor no encontrado");
      const nombreProveedor = proveedorDoc.data().nombre;

      // PHASE 1: ALL READS
      const stockUpdates: Array<{ref: any, newStock: number, newCost: number}> = [];
      const insumosActualizados: Set<string> = new Set();

      for (const detalle of data.detalles) {
        const collectionName = detalle.tipo === 'INSUMO' ? 'insumos' : 'productos';
        const itemRef = doc(db, collectionName, detalle.idItem);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error(`Item ${detalle.idItem} no encontrado en ${collectionName}`);
        }

        const currentStock = itemDoc.data().stock || 0;
        const nuevoStock = currentStock + detalle.cantidad;
        
        stockUpdates.push({ 
          ref: itemRef, 
          newStock: nuevoStock,
          newCost: detalle.costoUnitario
        });

        if (detalle.tipo === 'INSUMO') {
          insumosActualizados.add(detalle.idItem);
        }

        const subtotal = detalle.cantidad * detalle.costoUnitario;
        totalCompra += subtotal;

        detallesProcesados.push({
          tipo: detalle.tipo,
          idItem: detalle.idItem,
          nombre: detalle.nombre,
          cantidad: detalle.cantidad,
          costoUnitario: detalle.costoUnitario,
          subtotal
        });
      }

      // Recalcular costos de productos ELABORADOS si se actualizaron insumos
      const productosActualizaciones: Array<{ref: any, newCost: number}> = [];
      
      if (insumosActualizados.size > 0) {
        const productosQuery = query(
          collection(db, 'productos'),
          where('tipoProducto', '==', 'ELABORADO')
        );
        const productosSnapshot = await getDocs(productosQuery);
        
        for (const productoDoc of productosSnapshot.docs) {
          const receta = productoDoc.data().receta || [];
          const usaInsumoActualizado = receta.some((ing: any) => 
            insumosActualizados.has(ing.idInsumo)
          );
          
          if (usaInsumoActualizado) {
            let costoTotal = 0;
            for (const ingrediente of receta) {
              const insumoRef = doc(db, 'insumos', ingrediente.idInsumo);
              const insumoDoc = await transaction.get(insumoRef);
              
              if (insumoDoc.exists()) {
                const costoUnitario = insumoDoc.data().costo;
                costoTotal += costoUnitario * ingrediente.cantidad;
              }
            }
            
            productosActualizaciones.push({
              ref: doc(db, 'productos', productoDoc.id),
              newCost: costoTotal
            });
          }
        }
      }

      // PHASE 2: ALL WRITES
      
      // Actualizar stock e insumos
      for (const update of stockUpdates) {
        transaction.update(update.ref, { 
          stock: update.newStock,
          costo: update.newCost
        });
      }

      // Actualizar costos de productos ELABORADOS
      for (const update of productosActualizaciones) {
        transaction.update(update.ref, { 
          costo: update.newCost,
          updatedAt: serverTimestamp()
        });
      }

      // Crear documento Compra
      const compraRef = doc(collection(db, 'compras'));
      const nuevaCompra = {
        fechaHora: serverTimestamp(),
        idProveedor: data.idProveedor,
        nombreProveedor,
        nombreUsuario: data.nombreUsuario || 'Sistema',
        total: totalCompra,
        estado: 'PENDIENTE',
        detalles: detallesProcesados,
        dia: new Date().getDate(),
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
      };

      transaction.set(compraRef, nuevaCompra);
    });
  } catch (error) {
    console.error("Error al crear compra:", error);
    throw error;
  }
}

export const modificarCompra = async (id: string, data: CompraDTO): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      // --- PHASE 1: ALL READS ---
      
      // 1. Get the purchase to modify
      const compraRef = doc(db, 'compras', id);
      const compraDoc = await transaction.get(compraRef);
      
      if (!compraDoc.exists()) {
        throw new Error("Compra no encontrada");
      }

      const compraAnterior = compraDoc.data();
      const detallesAnteriores = compraAnterior.detalles || [];

      // 2. Get current state of items from the OLD purchase (to revert stock)
      // We need to map them to references first to perform the reads
      const itemsRevertirRefs = detallesAnteriores.map((detalle: any) => {
          const collectionName = detalle.tipo === 'INSUMO' ? 'insumos' : 'productos';
          return {
              ref: doc(db, collectionName, detalle.idItem),
              cantidad: detalle.cantidad,
              tipo: detalle.tipo,
              id: detalle.idItem
          };
      });

      const itemsRevertirDocs = await Promise.all(
          itemsRevertirRefs.map((item: any) => transaction.get(item.ref))
      );

      // 3. Get current state of items for the NEW purchase (to apply new stock)
      const itemsNuevosRefs = data.detalles.map((detalle: any) => {
          const collectionName = detalle.tipo === 'INSUMO' ? 'insumos' : 'productos';
          return {
              ref: doc(db, collectionName, detalle.idItem),
              cantidad: detalle.cantidad,
              costoUnitario: detalle.costoUnitario,
              tipo: detalle.tipo,
              id: detalle.idItem,
              nombre: detalle.nombre
          };
      });

      const itemsNuevosDocs = await Promise.all(
          itemsNuevosRefs.map((item: any) => transaction.get(item.ref))
      );

      // 4. Check for manufactured products that might need cost recalculation
      // (This is complex to do in a single transaction if we don't know which insumos changed yet,
      // but strictly speaking, we should read potential recipes here if we want to update them.
      // For simplicity and avoiding massive reads, we'll mark insumos updated and do the cost update
      // in a separate logic or accept that we might need to read again. 
      // HOWEVER, Firestore transaction reads MUST happen before writes. 
      // To strictly follow this, we must know which insumos are being updated.
      
      // Let's identify which insumos are being touched (reverted OR added)
      const insumosIds = new Set<string>();
      
      itemsRevertirRefs.forEach((item: any) => {
          if (item.tipo === 'INSUMO') insumosIds.add(item.id);
      });
      itemsNuevosRefs.forEach((item: any) => {
          if (item.tipo === 'INSUMO') insumosIds.add(item.id);
      });

      // If we have insumos, we fetch all manufactured products to see if they need updates
      // This might be expensive if we have thousands of products. 
      // A better approach for scalability would be a separate Cloud Function trigger.
      // For now, consistent with create workflow, we read them.
      // Note: We skipped automatic product cost update on edit for now to avoid complexity/errors
      // or we rely on a separate independent update later.


      // --- PHASE 2: CALCULATIONS & WRITES ---

      // Map to store temporary stock state to handle items that are both in old and new details
      // Key: Collection/ID, Value: Current Stock
      const stockMap = new Map<string, number>();
      
      // Initialize map with current DB values from reads
      // Process Revert items first
      itemsRevertirDocs.forEach((docSnap, index) => {
          if (docSnap.exists()) {
              const item = itemsRevertirRefs[index];
              const key = `${item.tipo === 'INSUMO' ? 'insumos' : 'productos'}/${item.id}`;
              if (!stockMap.has(key)) {
                  stockMap.set(key, (docSnap.data() as any).stock || 0);
              }
          }
      });
      
      // Process New items refs (might duplicate keys, that's fine, we want latest DB state)
      itemsNuevosDocs.forEach((docSnap, index) => {
          if (docSnap.exists()) {
              const item = itemsNuevosRefs[index];
              const key = `${item.tipo === 'INSUMO' ? 'insumos' : 'productos'}/${item.id}`;
              if (!stockMap.has(key)) {
                  stockMap.set(key, (docSnap.data() as any).stock || 0);
              }
          }
      });

      // 1. Revert previous stock
      itemsRevertirRefs.forEach((item: any) => {
          const key = `${item.tipo === 'INSUMO' ? 'insumos' : 'productos'}/${item.id}`;
          if (stockMap.has(key)) {
              const current = stockMap.get(key)!;
              stockMap.set(key, current - item.cantidad);
          }
      });

      // 2. Apply new stock and calculate total
      let totalCompra = 0;
      const detallesProcesados: any[] = [];

      itemsNuevosRefs.forEach((item: any, index: number) => {
          const docSnap = itemsNuevosDocs[index];
          if (!docSnap.exists()) {
               throw new Error(`Item ${item.id} no encontrado`);
          }

          const key = `${item.tipo === 'INSUMO' ? 'insumos' : 'productos'}/${item.id}`;
          const currentStockInMemory = stockMap.get(key) || 0; // Should be in map
          const nuevoStock = currentStockInMemory + item.cantidad;
          
          // Update map
          stockMap.set(key, nuevoStock);

          // Update DB
          transaction.update(item.ref, { 
              stock: nuevoStock,
              costo: item.costoUnitario
          });

          const subtotal = item.cantidad * item.costoUnitario;
          totalCompra += subtotal;

          detallesProcesados.push({
              tipo: item.tipo,
              idItem: item.id,
              nombre: item.nombre,
              cantidad: item.cantidad,
              costoUnitario: item.costoUnitario,
              subtotal
          });
      });

      // 3. Update purchase document
      transaction.update(compraRef, {
        total: totalCompra,
        detalles: detallesProcesados,
        updatedAt: serverTimestamp()
      });
      
      // Note: We deliberately skipped re-calculating ELABORATED products cost on edit
      // to avoid the "Query inside Transaction" complexity which often causes issues.
      // If that feature is critical, it should be moved to a Cloud Function.
    });
  } catch (error) {
    console.error("Error al modificar compra:", error);
    throw error;
  }
}

export const descargarComprobanteCompra = async (id: string): Promise<void> => {
  try {
    // Obtener la compra completa
    const compraRef = doc(db, 'compras', id);
    const compraDoc = await getDoc(compraRef);
    
    if (!compraDoc.exists()) {
      throw new Error("Compra no encontrada");
    }
    
    const compra: any = {
      idCompra: compraDoc.id,
      ...compraDoc.data(),
      // Ensure we use the populated names
      proveedor: compraDoc.data().nombreProveedor || compraDoc.data().proveedor || 'N/A',
      usuario: compraDoc.data().nombreUsuario || compraDoc.data().usuario || 'N/A',
      estadoCompra: compraDoc.data().estado || 'PENDIENTE'
    };

    // Generar e imprimir la factura
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      throw new Error("No se pudo abrir la ventana de impresión");
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
      }).format(value);
    };

    const formatearFecha = (fecha: any) => {
      if (!fecha) return '';
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const formatearHora = (fecha: any) => {
      if (!fecha) return '';
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura de Compra #${String(compra.idCompra).slice(-8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 { 
            font-size: 24px; 
            margin-bottom: 5px;
          }
          .header p { 
            font-size: 12px; 
            color: #666;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .info-box h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #666;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .info-row .label {
            color: #666;
          }
          .info-row .value {
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURA DE COMPRA</h1>
          <p>ID: ...${String(compra.idCompra).slice(-8)}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Información General</h3>
            <div class="info-row">
              <span class="label">Proveedor:</span>
              <span class="value">${compra.proveedor || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Usuario:</span>
              <span class="value">${compra.nombreUsuario || compra.usuario || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value">${compra.estadoCompra || 'PENDIENTE'}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>Fecha y Hora</h3>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${formatearFecha(compra.fechaHora)}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora:</span>
              <span class="value">${formatearHora(compra.fechaHora)}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto/Insumo</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">Costo Unitario</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(compra.detalles || []).map((detalle: any) => `
              <tr>
                <td>${detalle.nombre || 'N/A'}</td>
                <td class="text-right">${detalle.cantidad || 0}</td>
                <td class="text-right">${formatCurrency(detalle.costoUnitario || 0)}</td>
                <td class="text-right">${formatCurrency((detalle.cantidad || 0) * (detalle.costoUnitario || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="text-right">TOTAL GENERAL</td>
              <td class="text-right">${formatCurrency(compra.total || 0)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(contenidoHTML);
    ventanaImpresion.document.close();
    
    // Esperar a que se cargue el contenido antes de imprimir
    ventanaImpresion.onload = () => {
      ventanaImpresion.print();
    };
  } catch (error) {
    console.error("Error al generar comprobante:", error);
    throw error;
  }
}

export const obtenerEstadosCompra = async (): Promise<string[]> => {
  return ["PENDIENTE", "PAGADA", "ANULADA"];
}

export const toggleEstadoPagoCompra = async (id: string): Promise<void> => {
  try {
    const compraRef = doc(db, 'compras', id);
    const compraDoc = await getDoc(compraRef);
    
    if (!compraDoc.exists()) {
      throw new Error("Compra no encontrada");
    }

    const estadoActual = compraDoc.data().estado;
    let nuevoEstado: string;
    
    if (estadoActual === 'PENDIENTE') {
      nuevoEstado = 'PAGADA';
    } else if (estadoActual === 'PAGADA') {
      nuevoEstado = 'PENDIENTE';
    } else {
      // Si está ANULADA, no cambiar
      return;
    }

    await updateDoc(compraRef, { 
      estado: nuevoEstado,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al cambiar estado de pago:", error);
    throw error;
  }
}