# SIPAD — Cómo iniciar la app

Referencia rápida de comandos. Node 22 · npm 10 · entrada `server.js` · puerto **3001**.

## Iniciar en local

```bash
# 1) Entrar al proyecto
cd ~/Projects/sipad

# 2) Instalar dependencias (solo la primera vez o cuando cambien)
npm install

# 3) Arrancar en modo desarrollo (auto-recarga al guardar)
npm run dev
#    — o sin auto-recarga:
npm start

# 4) Abrir en el navegador
#    http://localhost:3001

# 5) Detener
#    Ctrl + C
```

## Configuración (.env en la raíz del proyecto)

Para correr en local **sin Postgres**, usa SQLite (lo más simple):

```
DB_ENGINE=sqlite
JWT_SECRET=algun-secreto-para-local
# DATABASE_URL solo se necesita si DB_ENGINE=postgres
```

- `DB_ENGINE=sqlite` → usa un archivo local (`backend/db/sipad.sqlite`). No requiere nada más.
- `DB_ENGINE=postgres` → requiere `DATABASE_URL` (así corre producción).
- El puerto se puede cambiar con `PORT=xxxx` en el `.env` (por defecto 3001).

## Desplegar a producción (Render)

Render redespliega automáticamente al hacer push a `main`:

```bash
cd ~/Projects/sipad
git add -A
git commit -m "descripción del cambio"
git push origin main
# Render detecta el push y redespliega en 1–2 min
# → https://sipad.onrender.com
```

## Comandos útiles de git

```bash
git status            # ver qué cambió
git pull origin main  # traer los últimos cambios del remoto
git log --oneline -5  # ver los últimos commits
```

## ⚠️ Importante: no pruebes contra producción

Si tu `.env` local tiene `DB_ENGINE=postgres` con el `DATABASE_URL` de Render, **todo lo que hagas en local (importar Excel, crear/borrar, experimentar) escribe en la base de datos REAL de la Alcaldía**. Eso fue lo que creó dependencias ficticias por error.

Para probar sin riesgo, usa el entorno local con SQLite:

```bash
cp .env.local.example .env   # cambia a SQLite local (archivo en tu máquina)
npm run dev
```

Cuando necesites volver a apuntar a producción, restaura tu `.env` con `DB_ENGINE=postgres` y el `DATABASE_URL` de Render.

## Notas

- Si `npm run dev` falla por dependencias, corre `npm install` de nuevo.
- Si el puerto 3001 está ocupado: `PORT=3002 npm run dev`.
- Producción usa Postgres (Render); local puede usar SQLite sin instalar nada.
