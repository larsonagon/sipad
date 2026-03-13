// backend/utils/tenant.helper.js

export function applyTenantFilter(baseQuery, req, alias = 'u') {
  
  // 🔥 MASTER ADMIN = sin filtro
  if (req.isMasterAdmin) {
    return {
      query: baseQuery,
      params: []
    }
  }

  // 🔒 Usuario normal → filtrar por entidad
  const query = `${baseQuery} AND ${alias}.id_entidad = ?`
  const params = [req.user.id_entidad]

  return { query, params }
}