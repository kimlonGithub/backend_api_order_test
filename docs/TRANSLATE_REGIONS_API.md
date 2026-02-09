# Translate Regions API — Implemented Endpoints

This document describes the REST API for **translate regions** and **translate region locales**. The implementation uses the two-table design: `translate_regions` and `translate_region_locales` (Option B). All endpoints are under the base path **`/translate-regions`** and are documented in Swagger under the **Translate Regions** tag.

---

## Base URL

- Local: `http://localhost:3000/translate-regions` (or whatever `PORT` is set in `.env`)
- Swagger UI: `http://localhost:3000/api` (if Swagger is enabled)

---

## Translate Regions

### List regions

**`GET /translate-regions`**

Returns all translate regions with a `supportedLocales` array derived from `translate_region_locales`, ordered by `sortOrder` then `id`.

| Query param | Type    | Required | Description                                    |
| ----------- | ------- | -------- | ---------------------------------------------- |
| `isActive`  | boolean | No       | Filter by active state. Use `true` or `false`. |

**Response (200):** Array of region objects (see [Region response shape](#region-response-shape) below).

**Example:** `GET /translate-regions?isActive=true`

---

### Get one region

**`GET /translate-regions/:id`**

Returns a single region by id (region code, e.g. `th`, `asia`) with `supportedLocales`.

| Param | Type   | Description       |
| ----- | ------ | ----------------- |
| `id`  | string | Region code (PK). |

**Response (200):** One region object (see [Region response shape](#region-response-shape)).

**Errors:** `404` — Region not found.

---

### Create region

**`POST /translate-regions`**

Creates a new translate region. You can optionally create locale rows in the same request via `supportedLocales`.

**Request body:**

| Field              | Type    | Required | Description                                      |
| ------------------ | ------- | -------- | ------------------------------------------------ |
| `id`               | string  | Yes      | Region code (e.g. `th`, `asia`). Max 32 chars.   |
| `name`             | string  | Yes      | Display name. Max 255.                           |
| `nativeName`       | string  | Yes      | Native display name. Max 255.                    |
| `flagUrl`          | string  | Yes      | URL or path to flag image. Max 512.              |
| `defaultLocale`    | string  | Yes      | Default locale for this region. Max 16.          |
| `isActive`         | boolean | No       | Default `true`.                                  |
| `sortOrder`        | integer | No       | Order for listing (lower first).                 |
| `supportedLocales` | array   | No       | Locales to create in `translate_region_locales`. |

Each item in `supportedLocales`:

| Field        | Type    | Required | Description              |
| ------------ | ------- | -------- | ------------------------ |
| `localeCode` | string  | Yes      | e.g. `en`, `th`. Max 16. |
| `sortOrder`  | integer | No       | Default: index in array. |

**Validation:** If `supportedLocales` is provided, `defaultLocale` must be one of the `localeCode` values in that array.

**Response (201):** Created region (full [Region response shape](#region-response-shape)).

**Errors:**

- `409` — Region with this `id` already exists.
- `400` — `defaultLocale` not in `supportedLocales`.

---

### Update region

**`PATCH /translate-regions/:id`**

Updates a region. Only sent fields are updated.

**Request body:** All fields optional.

| Field           | Type    | Description                                           |
| --------------- | ------- | ----------------------------------------------------- |
| `name`          | string  | Max 255.                                              |
| `nativeName`    | string  | Max 255.                                              |
| `flagUrl`       | string  | Max 512.                                              |
| `defaultLocale` | string  | Must be an existing supported locale for this region. |
| `isActive`      | boolean |                                                       |
| `sortOrder`     | integer | ≥ 0.                                                  |

**Response (200):** Updated region (full [Region response shape](#region-response-shape)).

**Errors:**

- `404` — Region not found.
- `400` — `defaultLocale` is not one of the region’s current supported locales.

---

### Delete region

**`DELETE /translate-regions/:id`**

Deletes the region. Locales in `translate_region_locales` for this region are removed by database cascade.

**Response (204):** No body.

**Errors:** `404` — Region not found.

---

## Region locales (nested under a region)

### List locales for a region

**`GET /translate-regions/:regionId/locales`**

Returns all locale rows for the given region, ordered by `sortOrder`.

| Param      | Type   | Description  |
| ---------- | ------ | ------------ |
| `regionId` | string | Region code. |

**Response (200):** Array of objects:

| Field        | Type   | Description        |
| ------------ | ------ | ------------------ |
| `regionId`   | string | Region code.       |
| `localeCode` | string | Locale code.       |
| `sortOrder`  | number | Order in the list. |

**Errors:** `404` — Region not found.

---

### Add locale to a region

**`POST /translate-regions/:regionId/locales`**

Adds one locale to the region.

**Request body:**

| Field        | Type    | Required | Description                      |
| ------------ | ------- | -------- | -------------------------------- |
| `localeCode` | string  | Yes      | e.g. `en`, `th`. Max 16.         |
| `sortOrder`  | integer | No       | Default: next after current max. |

**Response (201):** Created locale row: `{ regionId, localeCode, sortOrder }`.

**Errors:**

- `404` — Region not found.
- `409` — Locale with this `localeCode` already exists for this region.

---

### Update a region locale

**`PATCH /translate-regions/:regionId/locales/:localeCode`**

Updates a locale row (e.g. `sortOrder`).

| Param        | Type   | Description  |
| ------------ | ------ | ------------ |
| `regionId`   | string | Region code. |
| `localeCode` | string | Locale code. |

**Request body:**

| Field       | Type    | Required | Description |
| ----------- | ------- | -------- | ----------- |
| `sortOrder` | integer | No       | ≥ 0.        |

**Response (200):** Updated locale row: `{ regionId, localeCode, sortOrder }`.

**Errors:** `404` — Region or locale not found.

---

### Remove locale from a region

**`DELETE /translate-regions/:regionId/locales/:localeCode`**

Removes the locale from the region.

**Response (204):** No body.

**Errors:**

- `404` — Region or locale not found.
- `400` — Cannot remove the region’s `defaultLocale`; update the region’s `defaultLocale` first.

---

## Region response shape

All region responses (list, get one, create, update) use this shape (camelCase for frontend):

```json
{
  "id": "th",
  "name": "Thailand",
  "nativeName": "Thailand",
  "flagUrl": "/translate/th.png",
  "defaultLocale": "th",
  "isActive": true,
  "sortOrder": 2,
  "supportedLocales": ["en", "th"],
  "createdAt": "2025-02-05T12:00:00.000Z",
  "updatedAt": "2025-02-05T12:00:00.000Z"
}
```

| Field              | Type           | Description                                                           |
| ------------------ | -------------- | --------------------------------------------------------------------- |
| `id`               | string         | Region code.                                                          |
| `name`             | string         | Display name.                                                         |
| `nativeName`       | string         | Native display name.                                                  |
| `flagUrl`          | string         | Flag image URL or path.                                               |
| `defaultLocale`    | string         | Default locale for this region.                                       |
| `isActive`         | boolean        | Whether the region is available in translate UI.                      |
| `sortOrder`        | number \| null | Order for listing (lower first).                                      |
| `supportedLocales` | string[]       | Locale codes from `translate_region_locales`, ordered by `sortOrder`. |
| `createdAt`        | string (ISO)   | Row creation time.                                                    |
| `updatedAt`        | string (ISO)   | Last update time.                                                     |

---

## Summary table

| Method | Path                                               | Description                      |
| ------ | -------------------------------------------------- | -------------------------------- |
| GET    | `/translate-regions`                               | List regions (optional filter)   |
| GET    | `/translate-regions/:id`                           | Get one region                   |
| POST   | `/translate-regions`                               | Create region (optional locales) |
| PATCH  | `/translate-regions/:id`                           | Update region                    |
| DELETE | `/translate-regions/:id`                           | Delete region                    |
| GET    | `/translate-regions/:regionId/locales`             | List locales for region          |
| POST   | `/translate-regions/:regionId/locales`             | Add locale to region             |
| PATCH  | `/translate-regions/:regionId/locales/:localeCode` | Update locale (e.g. sortOrder)   |
| DELETE | `/translate-regions/:regionId/locales/:localeCode` | Remove locale from region        |

---

## Implementation details

- **Module:** `src/translate-regions/` (controller, service, module).
- **DTOs:** `src/dto/create-translate-region.dto.ts`, `update-translate-region.dto.ts`, `create-translate-region-locale.dto.ts`, `update-translate-region-locale.dto.ts`.
- **Database:** Prisma models `TranslateRegion` and `TranslateRegionLocale`; tables `translate_regions` and `translate_region_locales`. Deleting a region cascades to its locales.
- **Swagger:** All endpoints are tagged **Translate Regions** and appear in the API docs when Swagger is enabled.
