// Revisa los 4 informes del ICAF contra la base configurada en .env (no modifica datos).
// Uso:  node scripts/revisar-informes.mjs
import 'dotenv/config'
const { db } = await import('../backend/db/database.js')
const { default: InformesRepository } = await import('../backend/modules/informes/InformesRepository.js')
const { generarInformeWord } = await import('../backend/modules/informes/InformesDocumentGenerator.js')
const xls = await import('../backend/modules/informes/InformesExcelGenerator.js')
const { resolvePermissions } = await import('../backend/middlewares/role.middleware.js')

const repo = new InformesRepository(db)
const linea = (t) => console.log('\n=== ' + t + ' ===')
const ok = (n, d) => console.log('  OK   ' + n + (d ? ' — ' + d : ''))
const mal = (n, e) => console.log('  ERROR ' + n + ' — ' + (e?.message || e))
const prueba = async (n, f, d) => { try { const r = await f(); ok(n, d ? d(r) : '') ; return r } catch (e) { mal(n, e); return null } }

linea('Roles y acceso a Informes')
const roles = await db.all(`SELECT DISTINCT r.nombre, r.nivel_acceso, COUNT(u.id) AS usuarios FROM roles r LEFT JOIN usuarios u ON u.id_rol = r.id GROUP BY r.nombre, r.nivel_acceso ORDER BY r.nivel_acceso DESC`).catch(e => { mal('roles', e); return [] })
for (const r of roles) {
  const p = resolvePermissions({ rol: r.nombre, nivel_acceso: r.nivel_acceso })
  console.log(`  ${String(r.nivel_acceso).padStart(3)}  ${r.nombre.padEnd(28)} usuarios: ${String(r.usuarios).padStart(3)}  informes: ${p.puedeVerInformes ? 'sí' : 'no'}${p.informesSoloDependencia ? ' (solo su dependencia)' : ''}`)
}

const entidades = await db.all(`SELECT e.id, e.nombre, (SELECT COUNT(*) FROM segtec_actividades a WHERE a.entidad_id = e.id) AS act FROM entidades e ORDER BY act DESC`)
for (const e of entidades) {
  linea(`${e.nombre} (actividades ICAF: ${e.act})`)
  const acts = await prueba('1. Registro de actividades', () => repo.obtenerActividades(e.id, {}), r => `${r.length} filas`)
  if (acts?.length) {
    await prueba('   Word', () => generarInformeWord(acts), b => `${Math.round(b.length / 1000)} KB`)
    await prueba('   Excel', () => xls.generarInformeExcel(acts), b => `${Math.round(b.byteLength / 1000)} KB`)
    const sinFunc = acts.filter(a => !a.funcionario).length, sinDep = acts.filter(a => !a.dependencia).length
    if (sinFunc) console.log(`       aviso: ${sinFunc} actividades sin funcionario`)
    if (sinDep) console.log(`       aviso: ${sinDep} actividades sin dependencia`)
  }
  const res = await prueba('2. Resumen por dependencia', () => repo.obtenerResumenPorDependencia(e.id), r => `${r.length} dependencias`)
  if (res) await prueba('   Excel', () => xls.generarResumenDependenciasExcel(res), b => `${Math.round(b.byteLength / 1000)} KB`)
  await prueba('3. Producción documental', () => repo.obtenerProduccionDocumental(e.id, {}), r => `${r.length} actividades con documentos`)
  const sin = await prueba('4. Funcionarios sin actividad', () => repo.obtenerFuncionariosSinActividad(e.id, {}), r => `${r.length} funcionarios`)
  if (sin) await prueba('   Excel', () => xls.generarFuncionariosSinActividadExcel(sin), b => `${Math.round(b.byteLength / 1000)} KB`)
  const dep = await db.get(`SELECT id, nombre FROM dependencias WHERE entidad_id = ? LIMIT 1`, [e.id]).catch(() => null)
  if (dep) await prueba(`   Filtro por dependencia (${dep.nombre})`, () => repo.obtenerActividades(e.id, { dependencia: String(dep.id) }), r => `${r.length} filas`)
}
console.log('\nRevisión terminada.')
process.exit(0)
