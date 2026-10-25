#!/bin/bash
# ======================================================
# SIPAD · Copia la base de PRODUCCIÓN (Render) a la base LOCAL sipad_prod_copia
# ------------------------------------------------------
# Uso (en la Terminal, dentro del proyecto):
#   export RENDER_DB="postgresql://...oregon-postgres.render.com/sipad?sslmode=require"
#   ./scripts/copiar-prod-a-local.sh
#
# - Solo LEE de Render (pg_dump); nunca escribe en producción.
# - Reemplaza la base local sipad_prod_copia (la de sipad_local no se toca).
# - El archivo .dump queda en el Escritorio: contiene datos reales, no lo subas a GitHub.
# ======================================================
set -euo pipefail

LOCAL_DB="sipad_prod_copia"
ARCHIVO="$HOME/Desktop/sipad_prod_$(date +%Y-%m-%d_%H%M).dump"

if [ -z "${RENDER_DB:-}" ]; then
  echo "❌ Falta la dirección de Render. Primero ejecute:"
  echo '   export RENDER_DB="postgresql://usuario:clave@...oregon-postgres.render.com/sipad?sslmode=require"'
  exit 1
fi
case "$RENDER_DB" in
  *render.com*) ;;
  *) echo "❌ RENDER_DB no parece la dirección EXTERNA de Render (debe terminar en .render.com/...)"; exit 1 ;;
esac

echo "🔎 Versiones (pg_dump debe ser igual o mayor que el servidor):"
pg_dump --version
psql "$RENDER_DB" -Atc "show server_version"

echo "⬇️  Descargando copia de producción en $ARCHIVO ..."
pg_dump "$RENDER_DB" --no-owner --no-privileges -Fc -f "$ARCHIVO"

echo "♻️  Reemplazando la base local $LOCAL_DB ..."
dropdb --if-exists "$LOCAL_DB"
createdb "$LOCAL_DB"
pg_restore --no-owner --no-privileges -d "$LOCAL_DB" "$ARCHIVO"

echo "✅ Comparación (local vs. producción):"
for t in entidades dependencias usuarios segtec_actividades trd_series_propuestas; do
  l=$(psql "$LOCAL_DB" -Atc "select count(*) from $t" 2>/dev/null || echo "-")
  r=$(psql "$RENDER_DB" -Atc "select count(*) from $t" 2>/dev/null || echo "-")
  printf "   %-24s local: %-6s producción: %s\n" "$t" "$l" "$r"
done
echo "Listo. Reinicie SIPAD local (Ctrl + C y luego: npm run dev)."
