# Store Admin (Best Buy)

Vue 3 admin portal for managing orders and products in the Best Buy sample ecosystem.

This app is designed to run with backend services such as:

- `product-service` (products + image upload)
- `makeline-service` (orders)
- optional shipping and AI endpoints

## Tech Stack

- Vue 3
- Vue Router 4
- Vue CLI dev server middleware (proxy-style backend forwarding)
- Docker Compose for local service orchestration

## Features

- Order list and order detail workflows
- Product list, detail, create, edit, delete
- Product image upload with live preview
- Shipping progress visualization in order views
- Improved product form save robustness and validation UX:
  - inline field-level validation states
  - improved validation banner styling
  - safer save handling for non-JSON/empty backend responses

## Routes

- `/` and `/orders` -> order list
- `/order/:id` -> order detail
- `/products` -> product list
- `/product/add` -> create product
- `/product/:id` -> product detail
- `/product/:id/edit` -> edit product

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Docker Desktop (if running services via compose)

## Run Backend Services

From this folder, start dependencies with Docker Compose:

```bash
docker compose up -d
```

This repository's `docker-compose.yml` includes MongoDB, RabbitMQ, order-service, makeline-service, product-service, and virtual-customer.

To stop services:

```bash
docker compose down
```

## Run Frontend Locally

Install dependencies:

```bash
npm install
```

Set backend URLs and run app.

PowerShell (Windows):

```powershell
$env:VUE_APP_PRODUCT_SERVICE_URL = "http://localhost:3002/"
$env:VUE_APP_MAKELINE_SERVICE_URL = "http://localhost:3001/"
npm run serve
```

Bash (macOS/Linux):

```bash
export VUE_APP_PRODUCT_SERVICE_URL=http://localhost:3002/
export VUE_APP_MAKELINE_SERVICE_URL=http://localhost:3001/
npm run serve
```

Default frontend URL:

- `http://localhost:8081`

## Dev Server Backend Middleware

`vue.config.js` registers local middleware endpoints that forward to backend services:

- `/products`
- `/product/:id`
- `/product` (POST/PUT)
- `/makeline/order/fetch`
- `/makeline/order/:id`
- `/makeline/order` (PUT)
- `/ai/health`
- `/ai/generate/description`
- `/ai/generate/image`

Health endpoint exposed by frontend dev server:

- `/health`

## Available Scripts

- `npm run serve` - start local dev server on port `8081`
- `npm run build` - create production build
- `npm run lint` - run ESLint

## Notes

- If image upload/save fails, confirm `product-service` is reachable at `VUE_APP_PRODUCT_SERVICE_URL`.
- If orders are empty, confirm `makeline-service` and queue/database services are healthy.
- Shipping endpoints may depend on external service wiring in your deployment setup.

## Refactor Requirement

This codebase needs an ongoing refactor pass to improve maintainability and reduce technical debt.

Current goals:

- Remove unnecessary or unused code paths, imports, and legacy UI logic.
- Consolidate duplicate logic across product and order components.
- Standardize API error handling and response parsing patterns.
- Improve component structure by extracting reusable helpers where appropriate.
- Keep behavior unchanged while improving readability and testability.

Recommended workflow for cleanup:

1. Run lint and resolve all actionable warnings.
2. Identify dead/unused code and remove it safely.
3. Refactor one feature area at a time (products, orders, shipping UI).
4. Validate each step manually and with regression checks before merging.