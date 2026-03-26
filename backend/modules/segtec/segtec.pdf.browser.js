import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

let browserInstance = null

export async function getBrowser() {

  if (browserInstance) {
    try {
      await browserInstance.version()
      return browserInstance
    } catch {
      browserInstance = null
    }
  }

  console.log('🚀 Iniciando Puppeteer (primera vez)...')

  browserInstance = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  console.log('✅ Browser listo y en cache')

  return browserInstance
}