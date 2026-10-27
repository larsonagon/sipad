#!/bin/bash
# Publica en Render los cambios ya guardados en el repositorio local.
# En local no hace falta nada más: "npm run dev" (nodemon) recarga solo; basta Cmd+Shift+R en el navegador.
# Uso:  npm run publicar
set -e
cd "$(dirname "$0")/.."

# Si hay un git en curso, no tocar sus candados
if pgrep -x git >/dev/null; then echo "Hay un proceso de git en curso; espere a que termine y repita."; exit 1; fi

# Candados que quedan de commits anteriores
rm -f .git/*.lock .git/stale-*.lock 2>/dev/null || true

PEND=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')
if [ "$PEND" = "0" ]; then echo "No hay cambios nuevos para subir. Render ya está al día."; exit 0; fi

echo "Subiendo $PEND cambio(s) a GitHub:"
git log --oneline origin/main..HEAD
git push origin main
echo
echo "Listo. Render empieza el deploy solo (unos minutos)."
echo "  · Render: espere a que quede en Live y recargue con Cmd+Shift+R."
echo "  · Local:  recargue con Cmd+Shift+R (si cambió algo del servidor, reinicie con Ctrl+C y npm run dev)."
