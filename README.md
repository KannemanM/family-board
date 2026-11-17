# FamilyBoard

Tablero privado de organización familiar. Una pantalla grande (TV, tablet o
monitor) muestra la agenda del día y los próximos días en modo lectura, sin
login. Desde el celular o la computadora, los dos adultos administran
integrantes, categorías y actividades.

- **Tablero** en `/b/<token>`: reloj, fecha, actividades de hoy, recordatorios
  destacados y próximos 7 días. Se actualiza solo cada 15 segundos.
- **Panel** en `/agenda`: alta y edición de actividades, repeticiones,
  prioridades, recordatorios visuales, historial y exportación de datos.
- **Dos cuentas** con los mismos permisos, contraseñas hasheadas con scrypt.
- **SQLite** como única base de datos: un archivo, fácil de respaldar.

## Desarrollo local

Requisitos: Node 24.

```bash
npm install
cp .env.example .env.local   # opcional, hay valores por defecto
npm run dev
```

Abrí <http://localhost:3100>. La primera vez aparece el asistente de
configuración: nombre de la familia, zona horaria y las dos cuentas de
administración. Al terminar, el tablero ya tiene su dirección privada, que se
copia desde **Ajustes → Pantalla del tablero**.

Otros comandos:

```bash
npm test          # tests de fechas, recurrencia y recordatorios
npm run typecheck
npm run build
npm run db:generate   # nueva migración tras cambiar el esquema
```

## Variables de entorno

| Variable        | Por defecto                        | Para qué sirve                                            |
| --------------- | ---------------------------------- | --------------------------------------------------------- |
| `DATABASE_PATH` | `./data/familyboard.db`            | Archivo SQLite. En Docker conviene `/data/familyboard.db`. |
| `TZ`            | `America/Argentina/Buenos_Aires`   | Zona horaria del proceso (la del tablero se elige en la app). |
| `COOKIE_SECURE` | `false`                            | Poner `true` si el panel se abre por HTTPS.                |

La zona horaria que usa el tablero se configura dentro de la app, en
**Ajustes**. `TZ` solo afecta los logs del contenedor.

En desarrollo, FamilyBoard usa el puerto **3100** (`npm run dev`) para no chocar
con otras aplicaciones locales que ocupen el 3000. En Docker el contenedor
sigue escuchando en 3000, mapeado al puerto que elijas en el servidor.

## Docker

```bash
docker compose up -d --build
```

El contenedor corre como usuario sin privilegios, aplica las migraciones al
arrancar y guarda la base en el volumen `familyboard-data` (`/data`). El
healthcheck consulta `/api/health`.

Para probar la imagen sin compose:

```bash
docker build -t familyboard .
docker run -d -p 3000:3000 -v familyboard-data:/data \
  -e COOKIE_SECURE=true familyboard
```

### Dokploy

1. Crear una aplicación nueva apuntando a este repositorio.
2. Build type: **Dockerfile**, puerto `3000`.
3. Agregar un volumen persistente montado en `/data`.
4. Variables: `DATABASE_PATH=/data/familyboard.db`,
   `COOKIE_SECURE=true` (cuando el dominio tenga HTTPS).
5. Configurar el dominio y habilitar HTTPS.
6. Deploy. La primera visita al dominio muestra el asistente.

## Respaldos

Todo vive en un solo archivo SQLite más sus archivos WAL. La forma más segura
de copiarlo es con el contenedor detenido:

```bash
docker compose stop familyboard
docker run --rm -v familyboard-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/familyboard-$(date +%F).tar.gz -C /data .
docker compose start familyboard
```

Para restaurar, con el contenedor detenido, reemplazá el contenido de
`/data/familyboard.db` (y borrá `-wal`/`-shm`) por el del respaldo y volvé a
arrancar. Las migraciones se aplican solas.

Desde la app, **Ajustes → Datos** descarga un JSON con integrantes, categorías,
actividades y estados (sin contraseñas). Sirve como copia legible, pero para
restaurar se usa el archivo SQLite.

## Cómo se usa

- **Integrantes**: cada persona tiene nombre, color y emoji opcional.
- **Categorías**: vienen cargadas Escuela, Salud, Familia, Recreación,
  Cumpleaños, Recordatorios y Otros; se pueden editar y reordenar.
- **Actividades**: título, fecha, todo el día u horario, categoría, una o
  varias personas (o toda la familia), prioridad, notas y recordatorio visual.
- **Repeticiones**: diaria, semanal (con días), mensual o anual, con intervalo
  y fecha de fin. Cada ocurrencia se puede completar o eliminar por separado.
- **Eliminar**: en una actividad que se repite se quita solo esa fecha; en una
  de una sola vez se borra la actividad completa. No hay forma de recuperarla
  desde la agenda.
- **Historial**: últimos 60 días, incluyendo lo completado.
- **Recordatorios visuales**: cuando falta el tiempo indicado, la actividad se
  destaca arriba del tablero y aparece con un ícono en la agenda. No hay
  notificaciones push en esta versión.

## Estructura

```
src/app/(admin)      panel: agenda, integrantes, categorías, ajustes
src/app/b/[token]    tablero de solo lectura
src/app/api          board (polling), health, export
src/lib              fechas, recurrencia, consultas, auth, acciones
src/components       UI del panel y del tablero
drizzle/             migraciones SQL aplicadas al arrancar
scripts/verify.mjs   prueba end-to-end con Playwright (desarrollo)
```

## Notas

- El tablero no tiene login: quien tenga el enlace puede verlo. Se puede
  renovar el enlace desde Ajustes si se filtró.
- Los dos adultos cambian su propia contraseña desde Ajustes. Si alguien la
  olvida, la otra persona puede restablecerla desde el servidor:

  ```bash
  docker compose exec familyboard node scripts/reset-password.mjs ana "claveNueva"
  ```

  Eso cierra las sesiones de esa cuenta, no toca el resto de los datos.
- `scripts/verify.mjs` (`npm run verify`) necesita un Chromium de Playwright y
  un servidor en `localhost:3100`.
