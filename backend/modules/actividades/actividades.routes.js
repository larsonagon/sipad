import express from 'express'

export function registerActividadesRoutes(app, controller, verificarJWT) {

  const router = express.Router()

  router.use(verificarJWT)

  router.post('/', controller.create)
  router.get('/', controller.getAll)

  app.use('/api/actividades', router)
}
