<!-- @format -->

# KareAdminSite

KareAdminSite is a metadata-driven administration client built with Vue 3, TypeScript, Vite, and Element Plus. It provides the web interface for [KareAdminServer](https://github.com/Karelian-na/KareAdminServer) and can also serve as a reusable foundation for other RBAC-based management portals.

The client loads the current user's menus, permissions, page fields, and operation metadata from the server. It then creates authorized routes dynamically and renders either a shared management template or a page-specific component.

## Features

- **Permission-driven navigation** - build menus, tabs, routes, and available operations from the authorization data returned by the server.
- **Reusable list pages** - use `IndexTemplate` for search, tables, selection, operation buttons, pagination, dialogs, and data refresh workflows.
- **Metadata-driven forms** - use `EditTemplate` and server-provided field metadata to generate add, edit, and detail forms.
- **Extensible field rendering** - support text, numbers, dates, times, enums, images, files, radios, switches, checkboxes, JSON, sliders, and custom slots.
- **Administration modules** - manage users, roles, permissions, menus, database metadata, logs, and verification data.
- **Account self-service** - provide login, profile editing, password changes, and email or phone binding workflows.
- **First-run setup wizard** - detect an uninitialized server and guide administrators through database initialization.
- **File handling** - upload files, display progress, and preview image resources.
- **Data export** - export configured table fields and rows to Excel workbooks.
- **Session-aware requests** - retain the login session, redirect after authentication failures, and provide consistent loading and feedback behavior.
- **Theme preferences** - apply light or dark mode from the user's stored preferences.

## Technology Stack

- Vue 3
- TypeScript 5
- Vite 4
- Vue Router 4
- Element Plus
- Axios
- ExcelJS
- pnpm

## Prerequisites

- Node.js 18 or later
- pnpm 9 or later
- A running KareAdminServer instance

## Configuration

### Client Settings

Review `src/configs/index.ts` before development or deployment:

```ts
export namespace KasConfig {
    export const sysTitle = "Kas Administration System";
    export const sysIcon = "/admin/assets/imgs/favicon.png";

    export const axios = {
        serverHost: "/api",
    };

    export const iconfont = {
        prefix: "icon-",
        valueRegex: /^[\w-]+$/,
        libUrl: "https://example.com/iconfont.json",
    };
}
```

| Setting | Purpose |
| --- | --- |
| `sysTitle` | Browser title and system name |
| `sysIcon` | Public path to the application icon |
| `axios.serverHost` | Base URL used for all backend API requests |
| `iconfont.prefix` | CSS class prefix for icon names |
| `iconfont.valueRegex` | Validation rule for icon values |
| `iconfont.libUrl` | Icon library metadata URL |

The application sends requests with credentials enabled. A same-origin `/api` reverse proxy is recommended for production because it avoids cross-origin session-cookie issues.

### Vite Settings

The main Vite settings are defined in `vite.config.ts`:

- The source root is `src`.
- The public base path is `/admin`.
- The development server listens on `0.0.0.0:800`.
- Development proxy targets are configured for `/api` and `/resources`.
- Production files are written to `out`.

Update the proxy targets so they point to your KareAdminServer deployment.

## Install Dependencies

```bash
pnpm install
```

The repository uses `pnpm-lock.yaml`; keep it synchronized when dependencies change.

## Development

Start the Vite development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:800/admin/
```

Make sure `KasConfig.axios.serverHost` or the Vite proxy points to a reachable backend.

## Build

Create a production build:

```bash
pnpm build-www
```

The generated static files are written to:

```text
out/
```

Because the configured Vite base path is `/admin`, deploy the files under the same public path. Change `base` in `vite.config.ts` if the application will be hosted elsewhere.

## Deployment

KareAdminSite is a static single-page application. It can be deployed with Nginx, Caddy, a CDN, or any static hosting service that supports SPA fallback.

### Nginx Example

Copy the build output to the directory served as `/admin`:

```bash
mkdir -p /var/www/kare-admin-site/admin
cp -r out/* /var/www/kare-admin-site/admin/
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/kare-admin-site;

    location = /admin {
        return 301 /admin/;
    }

    location /admin/ {
        try_files $uri $uri/ /admin/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /resources/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
    }
}
```

For production:

- Serve the site over HTTPS.
- Set `KasConfig.axios.serverHost` to `/api` when using the reverse proxy above.
- Keep the `/admin` SPA fallback so refreshed dynamic routes return `index.html`.
- Align the backend's public resource URLs with the deployed domain.
- Configure caching for hashed static assets while avoiding long-lived caching for `index.html`.

## First-Time Setup

When the backend has not been initialized, the client redirects automatically to `/admin/databases/init`. The setup page:

1. Reads the configured database host and database name from the server.
2. Requests a temporary MySQL administrator username and password.
3. Starts server-side schema initialization.
4. Displays the initialization result and log.
5. Redirects to the normal login flow after initialization succeeds.

Keep the application private until initialization is complete. The initial account created by KareAdminServer is:

```text
Username: superadmin
Password: 123456
```

Change the initial password immediately after the first login.

## Secondary Development

Shared page infrastructure lives under `src/views/$frames/templates`:

- `IndexTemplate` owns the operation bar, data table, selection, pagination, refresh behavior, and modal workflow.
- `EditTemplate` builds forms from field configuration and exposes callbacks around preparation, rendering, change collection, pre-submit handling, and submission.
- `EditItem` maps field types to Element Plus controls and supports custom field slots.

Keep application-specific workflows in page components. Avoid placing domain behavior in the shared templates unless it is genuinely reusable.

To add a specialized page:

1. Create the page component under a business-specific directory in `src/views`.
2. Add its backend path to `ComponentsMapping` in `src/App.vue`.
3. Reuse `IndexTemplate` or `EditTemplate` and customize behavior through props, callbacks, and slots.
4. Configure the corresponding menu, permission, operation, and field metadata in KareAdminServer.

Routes without a specialized component use the common `IndexTemplate` automatically.

## Main Modules

| Module | Route area |
| --- | --- |
| Login and password recovery | `/admin/login`, `/admin/retrieve` |
| Home and personal settings | `/admin/home`, `/admin/personal` |
| Users and roles | `/admin/users`, `/admin/roles` |
| Menus and permissions | `/admin/menus`, `/admin/permissions` |
| Database metadata | `/admin/databases` |
| Audit logs | `/admin/logs` |
| Verification templates and codes | `/admin/verifications` |
