# Guía de Mantenimiento y Despliegue - Pa' Donde El Chamo

Esta guía describe los pasos necesarios para realizar modificaciones en el proyecto y desplegar los cambios a producción en Firebase.

## 1. Requisitos Previos

Asegúrate de tener instalado:
*   **Node.js** (Versión 18 o superior recomendada)
*   **Firebase CLI** (`npm install -g firebase-tools`)
*   Haber iniciado sesión en Firebase (`firebase login`)

## 2. Desarrollo Local (Modificaciones)

Si deseas hacer cambios y probarlos en tu computadora antes de subirlo:

1.  Abre la terminal en la carpeta principal del proyecto.
2.  Navega a la carpeta del frontend:
    ```bash
    cd frontend
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
4.  Abre el navegador en la dirección que te muestra (usualmente `http://localhost:5173`).
5.  Realiza tus cambios en el código. El navegador se actualizará automáticamente.

## 3. Preparar para Producción (Build)

Una vez que tus cambios estén listos y probados, debes empaquetar la aplicación para producción:

1.  En la terminal, dentro de la carpeta `frontend`:
    ```bash
    npm run build
    ```
    *Esto creará una carpeta `dist` con los archivos optimizados.*

## 4. Desplegar a Firebase (Deploy)

Para subir los cambios a internet. **Importante:** Como estamos usando el plan gratuito (Spark), debemos tener cuidado de no desplegar funciones (Cloud Functions) que requieran el plan pago (Blaze).

1.  Vuelve a la carpeta raíz del proyecto (si estabas en `frontend`):
    ```bash
    cd ..
    ```
    *(Debes estar donde se encuentra el archivo `firebase.json`)*

2.  Ejecuta el comando de despliegue específico:
    ```bash
    firebase deploy --only hosting,firestore
    ```

    **¿Por qué este comando?**
    *   `hosting`: Sube tu página web (lo que está en `frontend/dist`).
    *   `firestore`: Actualiza las reglas de seguridad e índices de la base de datos.
    *   *Evitamos desplegar `functions` para prevenir errores de facturación.*

## Resumen Rápido de Comandos

```bash
# 1. Hacer cambios y probar
cd frontend
npm run dev

# 2. Construir la versión final
npm run build

# 3. Subir a internet
cd ..
firebase deploy --only hosting,firestore
```

## Solución de Problemas Comunes

*   **Error "Blaze plan required"**: Asegúrate de usar el flag `--only hosting,firestore` y no simplemente `firebase deploy`.
*   **Cambios no se ven**: Asegúrate de haber ejecutado `npm run build` antes de hacer el deploy. Firebase sube la carpeta `dist`, si no reconstruyes, subirás la versión vieja.
*   **Error de permisos**: Verifica que estás logueado con la cuenta correcta usando `firebase login`.
