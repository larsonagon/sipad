import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = process.env.PORT || 3001

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FRONTEND_PATH = path.join(__dirname, 'frontend')

// ==========================================================
// DB
// ==========================================================

import { db } from './backend/db/database.js'

// ==========================================================
// 🔥 MIDDLEWARES
// ==========================================================

import { verificarJWT } from './backend/middlewares/auth.middleware.js'
import { multiTenant } from './backend/middlewares/multiTenant.middleware.js'

// ==========================================================
// RATE LIMIT
// ==========================================================

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de login. Intenta más tarde.'
  }
})

// ==========================================================
// IMPORTS
// ==========================================================

import { runAuthMigration } from './backend/modules/auth/auth.migration.js'
import authRoutes from './backend/modules/auth/auth.routes.js'

import { runRolesMigration } from './backend/modules/roles/roles.migration.js'
import rolesRoutes from './backend/modules/roles/roles.routes.js'

import { runDependenciasMigration } from './backend/modules/dependencias/dependencias.migration.js'
import dependenciasRoutes from './backend/modules/dependencias/dependencias.routes.js'

import { runNivelesMigration } from './backend/modules/niveles/niveles.migration.js'
import nivelesRoutes from './backend/modules/niveles/niveles.routes.js'

import { runCargosMigration } from './backend/modules/cargos/cargos.migration.js'
import cargosRoutes from './backend/modules/cargos/cargos.routes.js'

import { runEntidadesMigration } from './backend/modules/entidades/entidades.migration.js'
import { runMultiTenantMigration } from './backend/modules/entidades/entidades.extend.migration.js'
import entidadesRoutes from './backend/modules/entidades/entidades.routes.js'

import { runUsuariosMasterMigration } from './backend/modules/usuarios/usuarios.master.migration.js'
import { runUsuariosExtendMigration } from './backend/modules/usuarios/usuarios.extend.migration.js'
import usuariosRoutes from './backend/modules/usuarios/usuarios.routes.js'

import { runConfiguracionMigration } from './backend/modules/configuracion/configuracion.migration.js'
import { seedConfiguracionDefault } from './backend/modules/configuracion/configuracion.seeder.js'
import configuracionRoutes from './backend/modules/configuracion/configuracion.routes.js'

import auditoriaRoutes from './backend/modules/auditoria/auditoria.routes.js'

import { runTRDMigration } from './backend/modules/trd/trd.migration.js'
import { runActividadesMigration } from './backend/modules/actividades/actividades.migration.js'

// ✅ SEGTEC
import segtecRoutes from './backend/modules/segtec/segtec.routes.js'

// ✅ TRD-AI
import { runTRDAIMigration }    from './backend/modules/trd-ai/trd-ai.migration.js'
import { TRDAIRepository }      from './backend/modules/trd-ai/trd-ai.repository.js'
import { TRDAIService }         from './backend/modules/trd-ai/trd-ai.service.js'
import { TRDAIController }      from './backend/modules/trd-ai/trd-ai.controller.js'
import { registerTRDAIRoutes }  from './backend/modules/trd-ai/trd-ai.routes.js'

// ==========================================================
// INIT
// ==========================================================

async function init() {

  try {

    console.log('🚀 Iniciando backend...')

    const DB_ENGINE = process.env.DB_ENGINE || 'postgres'
    const isSQLite = DB_ENGINE === 'sqlite'

    app.use(express.json())

    // ==================================================
    // RATE LIMIT LOGIN
    // ==================================================

    app.use('/api/auth/login', loginLimiter)

    // ==================================================
    // MIGRACIONES
    // ==================================================

    if (isSQLite) {

      await runAuthMigration()
      await runRolesMigration(db)
      await runDependenciasMigration(db)
      await runNivelesMigration(db)
      await runCargosMigration(db)

      await runEntidadesMigration(db)
      await runMultiTenantMigration(db)

      await runUsuariosMasterMigration(db)
      await runUsuariosExtendMigration(db)

      await runConfiguracionMigration(db)
      await seedConfiguracionDefault(db)

      await runTRDMigration(db)
      await runActividadesMigration(db)

      // ✅ TRD-AI migration
      await runTRDAIMigration(db)

    }

    // ==================================================
    // INSTANCIAR TRD-AI
    // ==================================================

    const trdAIRepository = TRDAIRepository(db)
    const trdAIService    = TRDAIService(trdAIRepository)
    const trdAIController = TRDAIController(trdAIService)

    // ==================================================
    // DEBUG REQUESTS
    // ==================================================

    app.use((req, res, next) => {
      console.log(`➡️ ${req.method} ${req.originalUrl}`)
      next()
    })

    // ==================================================
    // PUBLIC
    // ==================================================

    app.use('/api/auth', authRoutes)

    // ==================================================
    // AUTH + TENANT
    // ==================================================

    app.use('/api', verificarJWT)
    app.use('/api', multiTenant)

    // ==================================================
    // RUTAS API
    // ==================================================

    console.log('🔥 ENTIDADES ROUTES MONTADO')
    app.use('/api/entidades', entidadesRoutes)

    app.use('/api/usuarios', usuariosRoutes)
    app.use('/api/roles', rolesRoutes)
    app.use('/api/dependencias', dependenciasRoutes)
    app.use('/api/niveles', nivelesRoutes)
    app.use('/api/cargos', cargosRoutes)
    app.use('/api/configuracion', configuracionRoutes)
    app.use('/api/auditoria', auditoriaRoutes)

    // ✅ SEGTEC
    app.use('/api/segtec', segtecRoutes)

    // ✅ TRD-AI
    registerTRDAIRoutes(app, trdAIController)

    // ==================================================
    // 🚨 404 API (CLAVE)
    // ==================================================

    app.use('/api', (req, res) => {
      return res.status(404).json({
        ok: false,
        error: 'Ruta API no encontrada'
      })
    })

    // ==================================================
    // FRONTEND
    // ==================================================

    app.use(express.static(FRONTEND_PATH))

    app.get('/', (req, res) => {
      res.sendFile(path.join(FRONTEND_PATH, 'auth', 'index.html'))
    })

    // ==================================================
    // FALLBACK SPA
    // ==================================================

    app.use((req, res, next) => {

      if (req.path.startsWith('/api')) return next()
      if (path.extname(req.path)) return next()

      return res.sendFile(path.join(FRONTEND_PATH, 'auth', 'index.html'))

    })

    // ==================================================
    // ERROR GLOBAL
    // ==================================================

    app.use((err, req, res, next) => {

      console.error('🔥 ERROR GLOBAL:', err)

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })

    })

    // ==================================================
    // SERVER
    // ==================================================

    app.listen(PORT, () => {
      console.log(`🔥 http://localhost:${PORT}`)
    })

  } catch (err) {

    console.error('❌ ERROR EN INIT:', err)
    process.exit(1)

  }

}

init()