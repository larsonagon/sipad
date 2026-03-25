import express from 'express'
import puppeteer from 'puppeteer'

import InformesRepository from './InformesRepository.js'
import InformesService from './InformesService.js'
import InformesController from './InformesController.js'

export function buildInformesRouter(db) {

  const router = express.Router()

  console.log('📊 INFORMES ROUTER inicializado')

  const repository = new InformesRepository(db)
  const service = new InformesService(repository)
  const controller = new InformesController(service)

  // ======================================
  // INFORME 1
  // REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  router.get(
    '/actividades',
    controller.obtenerActividades
  )

  router.get(
    '/registro-actividades-word',
    controller.generarWord
  )

  router.get(
    '/registro-actividades-excel',
    controller.generarExcel
  )

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  router.get(
    '/dependencias',
    controller.obtenerResumenDependencias
  )

  // ======================================
  // PDF DEPENDENCIAS (PUPPETEER LIMPIO)
  // ======================================

  router.get('/dependencias/pdf', async (req, res) => {

    let browser = null

    try {

      const token = req.headers.authorization?.split(' ')[1]

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // 🔐 Inyectar token antes de cargar
      if (token) {
        await page.evaluateOnNewDocument((token) => {
          sessionStorage.setItem('token', token)
        }, token)
      }

      // ⚠️ AJUSTAR EN PRODUCCIÓN
      await page.goto('http://localhost:3001/informes/dependencia.html', {
        waitUntil: 'networkidle0'
      })

      // ⏳ Esperar datos reales (NO solo el DOM)
      await page.waitForFunction(() => {
        const filas = document.querySelectorAll('#tablaDependencias tbody tr')
        return filas.length > 0 && !filas[0].innerText.includes('Cargando')
      })

      // 🔥 Ocultar elementos innecesarios
      await page.evaluate(() => {

        const header = document.getElementById('header')
        if (header) header.style.display = 'none'

        const btn = document.getElementById('btnExportar')
        if (btn) btn.style.display = 'none'

      })

      // 🎯 EXTRAER SOLO EL REPORTE
      const reporte = await page.$('#reporte')

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      })

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=informe_dependencias.pdf'
      })

      res.send(pdf)

    } catch (error) {

      console.error('❌ Error generando PDF:', error)
      res.status(500).send('Error generando PDF')

    } finally {

      if (browser) {
        await browser.close()
      }

    }

  })

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  router.get(
    '/produccion-documental',
    controller.obtenerProduccionDocumental
  )

  // ======================================
  // HEALTHCHECK
  // ======================================

  router.get('/health', (req, res) => {

    res.json({
      modulo: 'informes',
      estado: 'activo'
    })

  })

  return router

}