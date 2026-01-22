# Pa' Donde El Chamo (Sistema POS)

Este proyecto es un sistema de gestión para joyería/tienda, construido con **React + Vite + Firebase**.

## 🔥 **Migrado a Firebase - Sin Backend Local**

Este proyecto utiliza **Firebase** como backend, eliminando la necesidad de un servidor local:
- ✅ **Firebase Authentication** - Autenticación de usuarios
- ✅ **Cloud Firestore** - Base de datos NoSQL
- ✅ **Firebase Storage** - Almacenamiento de imágenes
- ✅ **Cloud Functions** - Lógica de negocio serverless (opcional)
- ✅ **Firebase Hosting** - Hosting gratuito

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- Cuenta de Firebase (gratuita)
- Firebase CLI (opcional, para Cloud Functions y Hosting)

## 🚀 Configuración Inicial

### 1. Configurar Firebase

Sigue la guía completa en: **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

Pasos resumidos:
1. Crear proyecto en Firebase Console
2. Habilitar Authentication (Email/Password)
3. Crear Firestore Database
4. Habilitar Firebase Storage
5. Crear archivo `.env` en `frontend/` (ver `.env.example`).
6. Copiar las credenciales de Firebase en el `.env`.
7. Configurar reglas de seguridad
7. Crear primer usuario administrador

### 2. Instalar Dependencias

```bash
cd frontend
npm install
```

### 3. Iniciar la Aplicación

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Credenciales por Defecto

Después de seguir la guía de configuración, tendrás un usuario administrador:
- **Email**: `admin@padondeloschamos.com`
- **Password**: `admin123` (cámbialo después del primer login)

## 🔑 Variables de Entorno (Importante)

El proyecto utiliza variables de entorno para proteger las credenciales.
1. Ve a la carpeta `frontend/`.
2. Copia el archivo `.env.example` y renómbralo a `.env`.
3. Llena los valores con tus credenciales de Firebase Console.

**NOTA**: El archivo `.env` está en `.gitignore` y **NO** debe subirse al repositorio.

## 📁 Estructura del Proyecto

```
paDondeLosChamos/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.config.ts    # Configuración de Firebase
│   │   │   └── firebase.ts           # Inicialización de Firebase
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Autenticación
│   │   │   ├── producto.service.ts   # Productos
│   │   │   ├── categoria.service.ts  # Categorías
│   │   │   ├── marca.service.ts      # Marcas
│   │   │   ├── proveedor.service.ts  # Proveedores
│   │   │   ├── venta.service.ts      # Ventas
│   │   │   └── compra.service.ts     # Compras
│   │   ├── types/
│   │   │   └── usuario.types.ts      # Tipos y enums
│   │   └── ...
│   └── package.json
├── functions/                   # Cloud Functions (opcional)
│   ├── src/
│   │   └── index.ts            # Funciones serverless
│   ├── package.json
│   └── tsconfig.json
├── FIREBASE_SETUP.md           # Guía de configuración de Firebase
├── CLOUD_FUNCTIONS_SETUP.md   # Guía de Cloud Functions (opcional)
└── README.md                   # Este archivo
```

## 🎯 Funcionalidades

### Módulos Implementados
- ✅ **Constructor de Ventas (POS)** - Interfaz optimizada para móviles, búsqueda rápida, lector de código de barras virtual y carritos múltiples.
- ✅ **Gestión de Stock Híbrida** - Soporte para Productos Simples y Productos Elaborados (con receta de insumos).
- ✅ **Alertas en Tiempo Real** - Notificaciones instantáneas de bajo stock (productos e insumos) en la barra lateral.
- ✅ **Autenticación Robusta** - Roles, recuperación segura y cierre de sesión controlado.
- ✅ **Productos e Insumos** - Inventario separado para mercancía de venta y materia prima.
- ✅ **Categorías, Marcas, Proveedores** - Gestión completa de catálogos auxiliares.
- ✅ **Caja y Gastos** - Control de flujo de efectivo.

### Características Técnicas
- 📱 **Mobile-First UX** - Entradas numéricas optimizadas, scroll inteligente y diseño responsivo.
- 🔄 **Transacciones Atómicas** - Integridad de datos al descontar stock de múltiples colecciones simultáneamente.
- 🔒 **Seguridad Avanzada** - Reglas de Firestore + Validación de Roles en Frontend.
- ⚡ **PWA Ready** - Preparado para instalación en dispositivos móviles.
- 🚀 **Serverless** - 100% Firebase (Hosting, Auth, Firestore).

## 🛠️ Servicios de Firebase

### Frontend Services

Todos los servicios están en `frontend/src/services/`:

```typescript
// Autenticación
import { loginUser, registerUser, logoutUser } from '@/services/auth.service';

// Productos
import { getAllProductos, createProducto, updateProducto } from '@/services/producto.service';

// Ventas
import { createVenta, getVentas } from '@/services/venta.service';
```

### Cloud Functions (Opcional)

Para funcionalidades avanzadas como asignación de roles y reportes automáticos:

Ver: **[CLOUD_FUNCTIONS_SETUP.md](./CLOUD_FUNCTIONS_SETUP.md)**

## 🌐 Despliegue en Producción

### Opción 1: Firebase Hosting (Recomendado)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar Hosting
firebase init hosting

# Build
cd frontend
npm run build

# Deploy
firebase deploy --only hosting
```

Tu app estará en: `https://tu-proyecto.web.app`

### Opción 2: Otros Servicios

Puedes desplegar en:
- **Vercel** - `vercel deploy`
- **Netlify** - `netlify deploy`
- **GitHub Pages** - Configurar GitHub Actions

## 💰 Costos

### Plan Gratuito (Spark)

Firebase ofrece un plan gratuito generoso:
- ✅ **50,000 lecturas/día** en Firestore
- ✅ **20,000 escrituras/día** en Firestore
- ✅ **1GB de almacenamiento** en Storage
- ✅ **10GB de transferencia/mes** en Hosting
- ✅ **125,000 invocaciones/mes** de Cloud Functions

**Suficiente para proyectos pequeños y medianos sin costo alguno.**

### Monitoreo de Uso

Revisa tu uso en: Firebase Console > Usage and billing

## 📚 Documentación Adicional

- [Guía de Configuración de Firebase](./FIREBASE_SETUP.md)
- [Guía de Cloud Functions](./CLOUD_FUNCTIONS_SETUP.md)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Firestore](https://firebase.google.com/docs/firestore)

## 🔄 Migración desde Backend Local

Si vienes del proyecto original con NestJS + MySQL:

1. ✅ **Autenticación** - Migrada a Firebase Auth
2. ✅ **Base de datos** - Migrada de MySQL a Firestore
3. ✅ **Lógica de negocio** - Movida al frontend y Cloud Functions
4. ✅ **Archivos** - Migrados de Cloudinary a Firebase Storage

**No se requiere backend local. Todo funciona con Firebase.**

## ⚠️ Notas Importantes

### Seguridad

- Las reglas de Firestore están configuradas para requerir autenticación
- Solo ADMIN puede crear/editar productos, categorías, marcas
- Todos los usuarios autenticados pueden crear ventas
- Revisa y ajusta las reglas según tus necesidades

### Backup

- Firestore no tiene backup automático en plan gratuito
- Exporta datos regularmente: Firebase Console > Firestore > Export

### Límites

- Monitorea tu uso para no exceder el plan gratuito
- Si necesitas más, considera el plan Blaze (pay-as-you-go)

## 🐛 Troubleshooting

### Error: "Firebase not configured"

Asegúrate de haber completado `frontend/src/config/firebase.config.ts` con tus credenciales.

### Error: "Permission denied"

Verifica que:
1. El usuario esté autenticado
2. Las reglas de Firestore estén configuradas correctamente
3. El usuario tenga el rol adecuado

### Error: "Insufficient stock"

El sistema valida stock antes de crear ventas. Verifica que haya stock suficiente.

## 📞 Soporte

Para problemas con Firebase:
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)

## 📝 Licencia

Este proyecto es privado y no tiene licencia pública.

---

**¡Listo para usar sin servidor backend! 🎉**
