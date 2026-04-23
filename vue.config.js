const { defineConfig } = require('@vue/cli-service')
const fetch = require("node-fetch")
const bodyParser = require('body-parser')
const http = require('http')
const https = require('https')
const { URL } = require('url')

const PRODUCT_SERVICE_URL = (process.env.VUE_APP_PRODUCT_SERVICE_URL || "http://localhost:3002/")
const MAKELINE_SERVICE_URL = (process.env.VUE_APP_MAKELINE_SERVICE_URL || "http://localhost:3001/")

async function sendUpstreamResponse(upstreamResponse, res) {
  const contentType = upstreamResponse.headers.get('content-type') || ''
  const bodyText = await upstreamResponse.text()

  res.status(upstreamResponse.status)

  if (!bodyText) {
    res.end()
    return
  }

  if (contentType.includes('application/json')) {
    try {
      res.send(JSON.parse(bodyText))
      return
    } catch (error) {
      // Fall through and return the raw payload when upstream sends malformed JSON.
      console.error('Invalid JSON response from upstream service:', error)
    }
  }

  res.send(bodyText)
}

async function forwardRequest(res, url, options = {}) {
  try {
    const upstreamResponse = await fetch(url, options)
    await sendUpstreamResponse(upstreamResponse, res)
  } catch (error) {
    console.error(`Failed to reach upstream endpoint ${url}:`, error)
    res.status(502).send({ error: 'Upstream service unavailable' })
  }
}

// Pipes multipart/form-data requests (e.g. image upload) directly to the upstream service.
function pipeRequest(req, res, targetUrl) {
  const parsed = new URL(targetUrl)
  const protocol = parsed.protocol === 'https:' ? https : http

  const forwardHeaders = { ...req.headers }
  delete forwardHeaders.host

  const proxyReq = protocol.request(
    { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname, method: 'POST', headers: forwardHeaders },
    (proxyRes) => {
      res.status(proxyRes.statusCode)
      Object.entries(proxyRes.headers).forEach(([k, v]) => res.setHeader(k, v))
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('Upload proxy error:', err)
    res.status(502).send({ error: 'Upload service unavailable' })
  })

  req.pipe(proxyReq)
}

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8081,
    host: '0.0.0.0',
    allowedHosts: 'all',
    client: false,
    webSocketServer: false,
    setupMiddlewares: (middlewares, devServer) => {
      
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.use(bodyParser.json())
      
      // Health check
      devServer.app.get('/health', (_, res) => {
        const version = process.env.APP_VERSION || '0.1.0'
        res.send({ status: 'ok', version: version})
      })

      // Get all orders
      devServer.app.get('/makeline/order/fetch', async (_, res) => {
        await forwardRequest(res, `${MAKELINE_SERVICE_URL}order/fetch`)
      })

      // Get a single order by id
      devServer.app.get('/makeline/order/:id', async (req, res) => {
        await forwardRequest(res, `${MAKELINE_SERVICE_URL}order/${req.params.id}`)
      })

      // Update an order
      devServer.app.put('/makeline/order', async (req, res) => {
        await forwardRequest(res, `${MAKELINE_SERVICE_URL}order`, {
          method: 'PUT',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' }
        })
      })

      // Delete an order
      devServer.app.delete('/makeline/order/:id', async (req, res) => {
        await forwardRequest(res, `${MAKELINE_SERVICE_URL}order/${req.params.id}`, { method: 'DELETE' })
      })

      // Get all products
      devServer.app.get('/products', async (_, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}`)
      });

      // Get a single product by id
      devServer.app.get('/product/:id', async (_, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}${_.params.id}`)
      });

      // Add product
      devServer.app.post('/product', async (req, res) => {
        console.log('Add product')
        const product = req.body
        console.log(product)

        await forwardRequest(res, `${PRODUCT_SERVICE_URL}`, {
          method: 'POST',
          body: JSON.stringify(product),
          headers: { 'Content-Type': 'application/json' }
        })
      })

      // Update product
      devServer.app.put('/product', async (req, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}`, {
          method: 'PUT',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' }
        })
      })

      // Delete product by id
      devServer.app.delete('/product/:id', async (req, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}${req.params.id}`, { method: 'DELETE' })
      })

      // Upload product image (multipart/form-data — piped directly to avoid buffering)
      devServer.app.post('/product/upload', (req, res) => {
        pipeRequest(req, res, `${PRODUCT_SERVICE_URL}upload`)
      })

      // AI service health
      devServer.app.get('/ai/health', async (_, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}ai/health`)
      })

      // Generate product description
      devServer.app.post('/ai/generate/description', async (req, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}ai/generate/description`, {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' }
        })
      })

      // Generate product image
      devServer.app.post('/ai/generate/image', async (req, res) => {
        await forwardRequest(res, `${PRODUCT_SERVICE_URL}ai/generate/image`, {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' }
        })
      })

      return middlewares;
    }

  }
})
