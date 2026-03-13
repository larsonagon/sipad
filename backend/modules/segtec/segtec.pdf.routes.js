import { Router } from 'express'
import { SEGTECPDFController } from './segtec.pdf.controller.js'

export function SEGTECPDFRoutes(service) {

  const router = Router()

  const controller = SEGTECPDFController(service)

  router.get('/:id/pdf', controller.generar)

  return router

}