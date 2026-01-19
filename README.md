# paDondeLosChamos - Sistema de Gestión

Este proyecto consiste en un sistema de gestión para una joyería, migrado de Java a un stack moderno con NestJS y React.

## Estructura del Proyecto

*   **backend/**: API RESTful construida con NestJS, TypeORM y MySQL.
*   **frontend/**: Aplicación web construida con React, Vite y TailwindCSS.

## Requisitos Previos

*   Node.js (v18 o superior)
*   MySQL Server (corriendo en puerto 3306)

## Configuración de Base de Datos

Este proyecto utiliza la base de datos: **padondeloschamos_db**

Asegúrate de crear la base de datos antes de iniciar el backend:

```sql
CREATE DATABASE padondeloschamos_db;
```

## Cómo Iniciar la Aplicación

Necesitarás dos terminales abiertas.

### 1. Iniciar el Backend (API)

En la primera terminal:

```bash
cd backend
npm install
npm run start
```

El servidor iniciará en `http://localhost:3000`.
Puedes verificar que está funcionando visitando `http://localhost:3000/api/health` (si existe) o `http://localhost:3000/api/usuario/lista`.

### 2. Iniciar el Frontend (Web)

En la segunda terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite iniciará el servidor de desarrollo, generalmente en `http://localhost:5173`.
Abre esa URL en tu navegador para usar la aplicación.

## Credenciales por Defecto

Si la base de datos se reinició, el usuario administrador por defecto (creado por el seed si aplica) o el que crees manualmente será necesario para operar.
