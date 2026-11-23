# CLAUDE.md — AI Image Background Remover

## 1. Project Overview
Modern, fast, production-ready AI image background remover. Users upload an image, remove its background with AI, preview original vs processed, edit the cutout, change/replace the background and download — no account.

**Do not implement** authentication, registration, login, user accounts, subscriptions or payments.

## 2. Technology Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui (only where it adds value), Zustand (editor state), native fetch, Lucide icons.
- **Backend:** Python, FastAPI, Pydantic, Pillow, rembg, ONNX Runtime.
- **Storage:** local temporary storage on the backend. UUID filenames (never the client filename), separate originals/processed, automatic expiry. Keep storage logic in `storage_service.py` so S3/R2 can be swapped in later.
- **Deployment:** Docker, Nginx reverse proxy, VPS, env vars for configuration.

## 3. Development Principles
1. Don't over-engineer. 2. Simple, readable code. 3. Reuse components only where it has real value. 4. No unnecessary abstractions/patterns. 5. No unnecessary files. 6. One responsibility per component. 7. API logic separate from UI. 8. Image processing separate from API routes. 9. Proper TypeScript types. 10. Consistent error handling. 11. No hardcoded secrets or env-specific URLs. 12. No libraries without a clear need. 13. No duplicate code. 14. Comments only where logic needs explanation. 15. Nothing outside current scope.

Inspect the existing structure before creating files; preserve working code.

## 4. Application Features

### 4.1 Landing Page
Navbar, logo, hero, upload area, before/after demo, features, how-it-works, FAQ, footer.
- Headline: "Remove Image Backgrounds in Seconds"
- Subheading: "Remove image backgrounds instantly with AI. Upload your image and download a clean transparent image in seconds."
- Primary action: "Upload Image" — upload is the primary focus.

### 4.2 Image Upload
JPG/JPEG/PNG/WebP. Drag-and-drop, browse button, preview before processing, size + dimension validation, upload progress, loading state, clear errors, remove selected image, retry. Max 20 MB; max dimensions/megapixels configurable. Single image only (no batch).

### 4.3 Background Removal (rembg)
Flow: receive → validate → verify actual format → open & normalize → rembg → transparent PNG → save → return metadata.
Preserve dimensions and transparency, PNG output, handle invalid images and AI failures, don't block unrelated requests, load the model once. Sync processing is OK for MVP; keep the service queue-ready.

### 4.4 Image Preview
Original, processed, before/after slider, checkerboard (UI only, never baked into the image), zoom controls, reset.

### 4.5 Image Editor
- Backgrounds: transparent, white, black, custom color, custom image, gradient.
- Image controls: crop, resize, rotate, zoom, move subject, fit to canvas, center subject.
- Undo, redo, reset. (Eraser/restore brushes: later phase.)
- **Rule:** the original cutout is never modified; editor state is kept separately.

### 4.6 Download
Transparent PNG, JPG with background, WebP with background. Preserve quality, meaningful filenames, intended dimensions, keep alpha in PNG, never flatten PNG onto white by accident.

## 5. Frontend Structure
```
frontend/src/
  app/ layout.tsx page.tsx globals.css editor/page.tsx
  components/
    layout/ Navbar.tsx Footer.tsx
    upload/ ImageUploader.tsx UploadPreview.tsx UploadProgress.tsx
    preview/ BeforeAfterSlider.tsx ImagePreview.tsx TransparencyGrid.tsx
    editor/ ImageEditor.tsx EditorToolbar.tsx BackgroundSelector.tsx ImageControls.tsx ExportDialog.tsx
    common/ LoadingSpinner.tsx ErrorMessage.tsx EmptyState.tsx
  services/imageService.ts
  stores/editorStore.ts
  hooks/useImageUpload.ts
  types/ image.ts editor.ts
  lib/ utils.ts constants.ts
  config/env.ts
public/images/
```
API requests live in services. Zustand only for shared editor state; local state for transient UI.

## 6. Backend Structure
```
backend/
  app/
    main.py                     app, routers, CORS, startup/shutdown
    config/settings.py          env vars, limits, storage dir, retention
    routes/image_routes.py      image endpoints
    routes/health_routes.py
    services/image_service.py   coordinates processing
    services/storage_service.py save/get/delete, safe paths
    ai/background_remover.py    rembg session + removal
    schemas/image_schema.py
    utils/file_validation.py    type, size, dimensions, real content
    core/exceptions.py
    tasks/cleanup.py
  requirements.txt Dockerfile .env.example
```

## 7. API (base `/api/v1`)
- `GET /health` → `{"status":"ok","service":"background-remover"}`
- `POST /images/remove-bg` (multipart `file`) → `{"success":true,"message":"Background removed successfully","data":{"image_id","original_url","processed_url","width","height","format":"PNG"}}`
- `GET /images/{image_id}` → metadata
- `DELETE /images/{image_id}` → delete files
- `POST /images/{image_id}/replace-background` → export with solid color / uploaded image / gradient. Frontend canvas gives live preview; backend can generate final export.

Error shape: `{"success":false,"message":"Unsupported image format","error":{"code":"INVALID_IMAGE_FORMAT"}}`
Status codes: 200, 400, 413, 415, 422, 429, 500. Never expose traces or filesystem paths.

## 8. Image Processing
Upload → endpoint → validation → preprocessing → remover → transparent PNG → temp storage → metadata → frontend preview → download.
Model once per worker; limit concurrent processing; careful with large dimensions; convert color modes to RGB/RGBA; preserve alpha when relevant; valid PNG output; Pillow for validation; never shell out on untrusted images.

## 9. Frontend State (Zustand)
originalImage, processedImage, selectedBackground, backgroundType, imageScale, imageRotation, imagePosition, cropSettings, history, historyIndex. Upload progress/loading in local state. No large base64 in global state; use object URLs and revoke them. Editor can reset to the original cutout.

## 10. UI/UX
Professional SaaS look: white background, dark typography, blue/violet accent, light gray borders, rounded cards, subtle shadows, consistent spacing, responsive. Desktop: top nav, large upload, side-by-side compare, editor with toolbar + canvas. Mobile: responsive nav, full-width upload, stacked preview, touch-friendly controls, mobile download button. Every action gets feedback (uploading, processing, failed, done, exporting, download ready).

## 11. Security
Upload size limit, real content + MIME validation, dimension limits, random filenames, path traversal protection, per-IP rate limiting, restricted CORS, safe static serving, temp cleanup, controlled concurrency, safe errors. Never trust client filename/MIME; don't expose the storage dir or arbitrary paths; retention policy on all temp images; store no personal data.

## 12. Temporary Files
`storage/{originals,processed,backgrounds,exports}`. UUID ids, delete associated files on delete, scheduled cleanup, retention via env (default 24h), never delete files currently being processed.

## 13. Performance
Avoid needless re-renders, lazy-load non-critical images, few client libs, small API responses, no base64 image JSON, serve files via controlled URLs, efficient model init, limited AI concurrency.

## 14. Environment
Frontend: `NEXT_PUBLIC_API_URL=http://localhost:8000`
Backend: `APP_ENV=development MAX_UPLOAD_SIZE_MB=20 MAX_IMAGE_PIXELS=25000000 STORAGE_DIR=storage FILE_RETENTION_HOURS=24 CORS_ORIGINS=http://localhost:3000`
No real secrets committed. Validate env at startup.

## 15. Testing
Backend: valid JPG/PNG/WebP, invalid file, oversized, corrupted, dimension limits, successful removal, transparent PNG output, deletion, cleanup, rate limiting.
Frontend: drag-drop, browse, invalid file, loading, failure states, before/after, background selection, editor reset, export, mobile.
A feature isn't done until its success path and key failure cases are tested.

## 16. Phases (implement in order)
1. **Setup:** frontend, backend, deps, env, CORS, health endpoint, verify communication.
2. **Core removal:** upload component, validation, rembg, remove-bg API, processed URL, show result, transparent PNG download. Must work end to end before moving on.
3. **UI:** before/after slider, upload progress, processing indicator, errors, responsive, empty states.
4. **Editor:** background colors, custom background upload, crop, rotate, resize, move/zoom, undo/redo, export.
5. **Production:** rate limiting, cleanup, security validation, error handling, logging, automated tests, Docker, Nginx, VPS.

## 17. Future (do not implement now)
Auth, dashboard, history, credits, subscriptions, payments, batch, AI background generation, advanced manual editing, public API, cloud storage.

## 18. Instructions for Claude Code
Inspect first; understand before changing; plan; frontend and backend separately; one phase at a time; explain important files; complete working code (no placeholders/TODOs for required features); never skip error handling; minimal deps; run and test; fix errors before the next phase; readable, beginner-friendly; don't rewrite working modules; no auth, payments, or microservices.

Prefer straightforward implementations: plain FastAPI routers, plain Python functions, few well-organized React components, Zustand only for shared editor state, simple service functions. No repositories, factories, DI layers or generic wrappers.

## 19. Definition of Done
Frontend and backend run and talk; supported uploads work; invalid images rejected safely; AI removal works; correct transparent PNG; original/processed preview; before/after works; transparent download; background change; editing + export; temp cleanup; proper API errors; responsive on desktop/mobile; key tests pass; Docker deployment works.
