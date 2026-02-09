# Translate Regions — Admin Implementation Guide

This document describes how to **implement admin features** for translate regions and region locales. It is aimed at frontend or full-stack developers building an **admin UI** that uses the [Translate Regions API](TRANSLATE_REGIONS_API.md).

---

## What admins can do

| Admin action                                            | API used                                                      | Notes                                              |
| ------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| View all regions (e.g. active only for translate UI)    | `GET /translate-regions?isActive=true`                        | Use no query to see all (including inactive).      |
| View one region and its locales                         | `GET /translate-regions/:id`                                  | Response includes `supportedLocales`.              |
| Create a new region (with or without locales)           | `POST /translate-regions`                                     | Optionally send `supportedLocales` in body.        |
| Edit region (name, flag, default locale, active, order) | `PATCH /translate-regions/:id`                                | Only send fields that change.                      |
| Deactivate / activate a region                          | `PATCH /translate-regions/:id` with `isActive: false \| true` | Inactive regions can be hidden from translate UI.  |
| Reorder regions                                         | `PATCH /translate-regions/:id` with `sortOrder`               | Lower number = higher in list.                     |
| Delete a region                                         | `DELETE /translate-regions/:id`                               | Cascades: all locales for that region are removed. |
| List locales for a region                               | `GET /translate-regions/:regionId/locales`                    | For “manage locales” screen.                       |
| Add a locale to a region                                | `POST /translate-regions/:regionId/locales`                   | Body: `{ "localeCode": "en", "sortOrder": 0 }`.    |
| Change locale order                                     | `PATCH /translate-regions/:regionId/locales/:localeCode`      | Body: `{ "sortOrder": 1 }`.                        |
| Remove a locale from a region                           | `DELETE /translate-regions/:regionId/locales/:localeCode`     | Blocked if it’s the region’s `defaultLocale`.      |

---

## Admin flows (step-by-step)

### 1. List regions in admin

- **Endpoint:** `GET /translate-regions` (no query = all regions; `?isActive=true` = only active).
- **Use in UI:** Table or list of regions with id, name, defaultLocale, isActive, sortOrder. Optionally filter by “Active only” using the same query.
- **Order:** API returns regions ordered by `sortOrder` then `id`; use as-is for display order.

### 2. Create a new region (with locales in one go)

1. Admin fills: **Region code (id)**, **Name**, **Native name**, **Flag URL**, **Default locale**, **Active** (checkbox), **Sort order** (optional).
2. Admin adds one or more **supported locales** (e.g. “en”, “th”) with optional sort order.
3. **Validation in UI:** Ensure **default locale** is one of the supported locales before submit.
4. **Request:**

```http
POST /translate-regions
Content-Type: application/json

{
  "id": "th",
  "name": "Thailand",
  "nativeName": "Thailand",
  "flagUrl": "/translate/th.png",
  "defaultLocale": "th",
  "isActive": true,
  "sortOrder": 2,
  "supportedLocales": [
    { "localeCode": "en", "sortOrder": 0 },
    { "localeCode": "th", "sortOrder": 1 }
  ]
}
```

5. On **201**, show success and redirect to region list or detail. On **409**, show “Region id already exists”. On **400**, show “Default locale must be one of the supported locales.”

### 3. Edit a region

1. Load region: `GET /translate-regions/:id`.
2. Form: name, nativeName, flagUrl, defaultLocale (dropdown of current `supportedLocales`), isActive, sortOrder.
3. **Validation:** `defaultLocale` must be one of the region’s current `supportedLocales`. If the user removes the current default from locales first, they must change default before saving.
4. **Request:**

```http
PATCH /translate-regions/th
Content-Type: application/json

{
  "name": "Thailand",
  "defaultLocale": "th",
  "isActive": true,
  "sortOrder": 2
}
```

5. On **400**, show “Default locale must be one of the supported locales.”

### 4. Activate / deactivate a region

- **Request:** `PATCH /translate-regions/:id` with `{ "isActive": true }` or `{ "isActive": false }`.
- **Use in UI:** Toggle or “Active” checkbox on region row or detail. Public translate UI can call `GET /translate-regions?isActive=true` so inactive regions are hidden.

### 5. Manage locales for a region

1. **List:** `GET /translate-regions/:regionId/locales` → show table: localeCode, sortOrder, and “Remove” (and “Set as default” if you allow changing default from this screen).
2. **Add locale:** Form with `localeCode` (and optional `sortOrder`). Submit:

```http
POST /translate-regions/th/locales
Content-Type: application/json

{ "localeCode": "zh", "sortOrder": 2 }
```

- On **409**, show “This locale is already added for this region.”

3. **Reorder:** For each locale row, allow editing `sortOrder` and call:

```http
PATCH /translate-regions/th/locales/zh
Content-Type: application/json

{ "sortOrder": 1 }
```

4. **Remove locale:** `DELETE /translate-regions/:regionId/locales/:localeCode`.
   - If API returns **400**, the locale is the region’s **defaultLocale**. Show: “Cannot remove the default locale. Set another locale as default first,” then link to edit region to change `defaultLocale`.

### 6. Delete a region

1. **Confirmation:** “This will delete the region and all its locales. Continue?”
2. **Request:** `DELETE /translate-regions/:id`.
3. On **204**, remove from list or redirect. On **404**, show “Region not found.”

---

## Validation rules (admin must respect)

| Rule                                           | Where it applies       | Admin UI behavior                                                                                                              |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Region `id` is unique                          | Create region          | If **409**, suggest changing id or editing existing.                                                                           |
| `defaultLocale` must be in `supportedLocales`  | Create / update region | Dropdown or list only offers current supported locales; or validate before submit.                                             |
| Cannot remove a locale that is `defaultLocale` | Delete locale          | Before calling DELETE, check if `localeCode === region.defaultLocale`; if so, show message and require changing default first. |
| Locale (regionId + localeCode) is unique       | Add locale             | If **409**, show “Locale already added.”                                                                                       |

---

## Suggested admin screens

1. **Regions list**
   - Table: id, name, defaultLocale, isActive, sortOrder, actions (Edit, Manage locales, Delete).
   - Filter: All / Active only (use `GET /translate-regions` vs `?isActive=true`).
   - Button: “Add region” → create form (see flow 2).

2. **Region create / edit**
   - Form: id (create only), name, nativeName, flagUrl, defaultLocale, isActive, sortOrder.
   - On create: optional “Supported locales” list (localeCode + sortOrder).
   - On edit: defaultLocale = dropdown from current `supportedLocales` (from `GET /translate-regions/:id`).

3. **Manage locales (per region)**
   - Breadcrumb: Regions > [Region name].
   - List from `GET /translate-regions/:regionId/locales`.
   - Add locale form; reorder (e.g. drag-and-drop → PATCH sortOrder); remove (with check for defaultLocale).

4. **Delete region**
   - Confirmation modal; on confirm call `DELETE /translate-regions/:id`.

---

## Authentication and authorization

The Translate Regions API **does not enforce auth** in this project. For a real admin:

- Protect admin routes (e.g. with a guard or API gateway) so only authenticated admin users can call POST / PATCH / DELETE (and optionally GET for all regions).
- Use the same base URL and endpoints; add your auth (e.g. Bearer token or session cookie) as required by your backend.

---

## Quick reference: endpoints for admin

| Admin task                 | Method | Path                                               |
| -------------------------- | ------ | -------------------------------------------------- |
| List all regions           | GET    | `/translate-regions`                               |
| List active regions only   | GET    | `/translate-regions?isActive=true`                 |
| Get one region             | GET    | `/translate-regions/:id`                           |
| Create region              | POST   | `/translate-regions`                               |
| Update region              | PATCH  | `/translate-regions/:id`                           |
| Delete region              | DELETE | `/translate-regions/:id`                           |
| List locales of region     | GET    | `/translate-regions/:regionId/locales`             |
| Add locale                 | POST   | `/translate-regions/:regionId/locales`             |
| Update locale (e.g. order) | PATCH  | `/translate-regions/:regionId/locales/:localeCode` |
| Remove locale              | DELETE | `/translate-regions/:regionId/locales/:localeCode` |

For request/response shapes, query params, and error codes, see [TRANSLATE_REGIONS_API.md](TRANSLATE_REGIONS_API.md).
