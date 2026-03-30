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

// 🔥 RATE LIMIT LOGIN
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
// IMPORTACIONES BACKEND
// ==========================================================

// AUTH
import { runAuthMigration } from './backend/modules/auth/auth.migration.js'
import authRoutes from './backend/modules/auth/auth.routes.js'

// ROLES
import { runRolesMigration } from './backend/modules/roles/roles.migration.js'
import rolesRoutes from './backend/modules/roles/roles.routes.js'

// DEPENDENCIAS
import { runDependenciasMigration } from './backend/modules/dependencias/dependencias.migration.js'
import dependenciasRoutes from './backend/modules/dependencias/dependencias.routes.js'

// NIVELES
import { runNivelesMigration } from './backend/modules/niveles/niveles.migration.js'
import nivelesRoutes from './backend/modules/niveles/niveles.routes.js'

// CARGOS
import { runCargosMigration } from './backend/modules/cargos/cargos.migration.js'
import cargosRoutes from './backend/modules/cargos/cargos.routes.js'

// ENTIDADES
import { runEntidadesMigration } from './backend/modules/entidades/entidades.migration.js'
import { runMultiTenantMigration } from './backend/modules/entidades/entidades.extend.migration.js'
import entidadesRoutes from './backend/modules/entidades/entidades.routes.js'

// USUARIOS
import { runUsuariosMasterMigration } from './backend/modules/usuarios/usuarios.master.migration.js'
import { runUsuariosExtendMigration } from './backend/modules/usuarios/usuarios.extend.migration.js'
import usuariosRoutes from './backend/modules/usuarios/usuarios.routes.js'

// CONFIGURACIÓN
import { runConfiguracionMigration } from './backend/modules/configuracion/configuracion.migration.js'
import { seedConfiguracionDefault } from './backend/modules/configuracion/configuracion.seeder.js'
import configuracionRoutes from './backend/modules/configuracion/configuracion.routes.js'

// AUDITORÍA
import auditoriaRoutes from './backend/modules/auditoria/auditoria.routes.js'

// TRD
import { runTRDMigration } from './backend/modules/trd/trd.migration.js'

// ACTIVIDADES CORE
import { runActividadesMigration } from './backend/modules/actividades/actividades.migration.js'

// ==========================================================
// TRD AI
// ==========================================================

import { runTRDAIMigration } from './backend/modules/trd-ai/trd-ai.migration.js'
import { TRDAIService } from './backend/modules/trd-ai/trd-ai.service.js'
import { TRDAIRepository } from './backend/modules/trd-ai/trd-ai.repository.js'
import { TRDAIController } from './backend/modules/trd-ai/trd-ai.controller.js'
import { registerTRDAIRoutes } from './backend/modules/trd-ai/trd-ai.routes.js'

// ==========================================================
// SEG-TEC
// ==========================================================

import { buildSEGTECRouter }
  from './backend/modules/segtec/segtec.actividades.routes.js'

import { runSEGTECConfiguracionMigration }
  from './backend/modules/segtec/segtec.configuracion.migration.js'

import { runSEGTECValidacionTecnicaMigration }
  from './backend/modules/segtec/segtec.validacion.tecnica.migration.js'

import { runSEGTECFormBaseMigration }
  from './backend/modules/segtec/segtec.formulario.base.migration.js'

import { runSEGTECActividadesMigration }
  from './backend/modules/segtec/segtec.actividades.migration.js'

import { runSEGTECPropuestasMigration }
  from './backend/modules/segtec/segtec.propuestas.migration.js'

// ==========================================================
// INFORMES
// ==========================================================

import { buildInformesRouter }
  from './backend/modules/informes/informes.routes.js'

// ==========================================================
// INIT
// ==========================================================

async function init() {

  try {

    console.log('🚀 Iniciando backend...')
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'NO DEFINIDO')

    const DB_ENGINE = process.env.DB_ENGINE || 'postgres'
    const isSQLite = DB_ENGINE === 'sqlite'

    console.log('🧠 DB_ENGINE:', DB_ENGINE)
    console.log('🧠 DATABASE_URL:', process.env.DATABASE_URL || 'NO DEFINIDA')

    app.use(express.json())

    // ==================================================
    // RATE LIMIT LOGIN
    // ==================================================

    app.use('/api/auth/login', loginLimiter)

    // ==================================================
    // MIGRACIONES
    // ==================================================

    if (isSQLite) {

      console.log('🧱 Ejecutando migraciones SQLite...')

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
      await runTRDAIMigration(db)

      await runSEGTECConfiguracionMigration(db)
      await runSEGTECFormBaseMigration(db)
      await runSEGTECActividadesMigration(db)
      await runSEGTECValidacionTecnicaMigration(db)
      await runSEGTECPropuestasMigration(db)

      console.log('✅ Migraciones SQLite ejecutadas')

    } else {

      console.log('🐘 PostgreSQL detectado — migraciones SQLite omitidas')

    }

    // ==================================================
    // TRD-AI
    // ==================================================

    const trdAIRepository = TRDAIRepository(db)
    const trdAIService = TRDAIService(trdAIRepository)
    const trdAIController = TRDAIController(trdAIService)

    // ==================================================
    // 🔥 AUTH (PRIMERO SIN PROTEGER)
    // ==================================================

    app.use('/api/auth', authRoutes)

    // ==================================================
    // 🔒 PROTECCIÓN GLOBAL (DESPUÉS DE AUTH)
    // ==================================================

    app.use('/api', verificarJWT, multiTenant)

    // ==================================================
    // RUTAS
    // ==================================================

    app.use('/api/roles', rolesRoutes)
    app.use('/api/dependencias', dependenciasRoutes)
    app.use('/api/niveles', nivelesRoutes)
    app.use('/api/cargos', cargosRoutes)
    app.use('/api/entidades', entidadesRoutes)
    app.use('/api/usuarios', usuariosRoutes)
    app.use('/api/configuracion', configuracionRoutes)
    app.use('/api/auditoria', auditoriaRoutes)

    registerTRDAIRoutes(app, trdAIController)

    app.use('/api/segtec', buildSEGTECRouter(db, trdAIService))

    console.log('📊 Cargando módulo INFORMES...')
    app.use('/api/informes', buildInformesRouter(db))

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

    app.listen(PORT, '0.0.0.0', () => {

      console.log(`🔥 Servidor en puerto ${PORT}`)
      console.log(`🌐 URL interna: http://0.0.0.0:${PORT}`)

    })

  } catch (err) {

    console.error('❌ ERROR EN INIT:', err)
    process.exit(1)

  }

}

init()