import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT =
  process.env.SHOTS_DIR ??
  "/private/var/folders/1v/5v5b5y2x07lcg9ztmdmd9sg00000gn/T/opencode/fb-test/shots";
const CHROME =
  process.env.CHROME_PATH ??
  "/Users/martin/Library/Caches/ms-playwright/chromium_headless_shell-1187/chrome-mac/headless_shell";

fs.mkdirSync(OUT, { recursive: true });

const PASSWORD = "familia123";
const NEW_PASSWORD = "nuevaClave123";

const pad = (value) => String(value).padStart(2, "0");
const isoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));

const checks = [];
function check(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function shot(name, options = {}) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), ...options });
}

async function fillActivity({
  title,
  date,
  allDay = true,
  startTime,
  endTime,
  member,
  category,
  priority = "Normal",
  notes,
  reminder,
  recurrence,
}) {
  await page.goto(`${BASE}/agenda/nueva`, { waitUntil: "networkidle" });
  await page.fill("#title", title);

  if (date) await page.fill("#date", date);

  const allDayBox = page.getByRole("checkbox", { name: "Todo el día" });
  if (allDay) {
    if (!(await allDayBox.isChecked())) await allDayBox.check();
  } else {
    await allDayBox.uncheck();
    await page.fill("#startTime", startTime);
    if (endTime) await page.fill("#endTime", endTime);
  }

  if (member) await page.getByRole("button", { name: member, exact: false }).click();
  if (category) await page.getByRole("button", { name: category, exact: true }).click();
  await page.getByRole("button", { name: priority, exact: true }).click();

  if (notes || reminder || recurrence) {
    await page.getByRole("button", { name: /Más opciones/ }).click();
    if (notes) await page.fill("#notes", notes);
    if (reminder) {
      await page.getByRole("checkbox", { name: "Activar" }).check();
      await page.getByRole("button", { name: reminder }).click();
    }
    if (recurrence) await page.selectOption("#recurrence", recurrence);
  }

  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await page.waitForURL("**/agenda");
  await page.waitForTimeout(300);
}

try {
  // ---------- 1. Setup ----------
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForURL("**/setup");
  await page.fill("#familyName", "Casa Martín");
  await page.selectOption("#timezone", "America/Argentina/Buenos_Aires");
  await page.fill("#name1", "Martín");
  await page.fill("#username1", "martin");
  await page.fill("#password1", PASSWORD);
  await page.fill("#name2", "Ana");
  await page.fill("#username2", "ana");
  await page.fill("#password2", PASSWORD);
  await shot("01-setup", { fullPage: true });
  await page.getByRole("button", { name: "Crear FamilyBoard" }).click();
  await page.waitForURL("**/agenda**");
  check("setup completa y entra al panel", page.url().includes("/agenda"));

  // ---------- 2. Integrantes ----------
  await page.goto(`${BASE}/integrantes`, { waitUntil: "networkidle" });
  for (const name of ["Martín", "Ana"]) {
    await page.getByRole("button", { name: "Agregar", exact: true }).click();
    await page.fill("#member-name", name);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page
      .locator("ul.card li", { hasText: name })
      .first()
      .waitFor({ timeout: 15000 });
  }
  check(
    "se crean los dos integrantes",
    (await page.locator("ul.card li").count()) === 2,
  );
  await shot("02-integrantes", { fullPage: true });

  // ---------- 3. Actividades ----------
  await fillActivity({
    title: "Turno con la pediatra",
    allDay: false,
    startTime: "15:30",
    endTime: "16:15",
    member: /^Ana/,
    category: "Salud",
    priority: "Importante",
    notes: "Llevar la libreta de vacunas.",
    reminder: "1 día antes",
  });

  await fillActivity({
    title: "Entregar trabajo de ciencias",
    member: /^Ana/,
    category: "Escuela",
    priority: "Urgente",
  });

  await fillActivity({
    title: "Reunión de padres",
    date: isoDate(1),
    allDay: false,
    startTime: "18:00",
    member: /^Martín/,
    category: "Escuela",
  });

  await fillActivity({
    title: "Cumpleaños de la abuela",
    date: isoDate(3),
    member: "Toda la familia",
    category: "Cumpleaños",
    priority: "Importante",
  });

  // Futura con recordatorio activo: alimenta la tarjeta destacada del tablero.
  await fillActivity({
    title: "Examen de Matemática",
    date: isoDate(1),
    allDay: false,
    startTime: "09:00",
    member: /^Ana/,
    category: "Escuela",
    priority: "Importante",
    reminder: "1 día antes",
  });

  await fillActivity({
    title: "Clase de natación",
    date: isoDate(5),
    allDay: false,
    startTime: "09:00",
    member: /^Ana/,
    category: "Recreación",
  });

  // Recurrencia semanal sin días elegidos: debe repetirse el mismo día de la fecha base.
  await fillActivity({
    title: "Clase de guitarra",
    date: isoDate(-7),
    allDay: false,
    startTime: "17:00",
    member: /^Martín/,
    category: "Recreación",
    recurrence: "weekly",
  });

  // Actividad pasada para probar el historial.
  await fillActivity({
    title: "Compra de útiles",
    date: isoDate(-3),
    member: "Toda la familia",
    category: "Escuela",
  });

  check(
    "actividades visibles en la agenda",
    (await page.getByText("Turno con la pediatra").count()) > 0,
  );
  await shot("03-agenda-desktop", { fullPage: true });

  // ---------- 4. Token del tablero ----------
  await page.goto(`${BASE}/ajustes`, { waitUntil: "networkidle" });
  const settingsText = await page.locator("body").innerText();
  const match = settingsText.match(/\/b\/([A-Za-z0-9_-]{10,})/);
  if (!match) throw new Error("No se encontró el token del tablero en Ajustes");
  const boardPath = match[0];
  const token = match[1];
  console.log("board path:", boardPath);
  await shot("04-ajustes", { fullPage: true });

  // ---------- 5. Tablero ----------
  await page.goto(BASE + boardPath, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  check(
    "el tablero muestra la actividad de hoy",
    (await page.getByText("Turno con la pediatra").count()) > 0,
  );
  check(
    "la recurrencia semanal cae en el día correcto",
    (await page.getByText("Clase de guitarra").count()) > 0,
  );

  const viewports = [
    { name: "05-board-tv", width: 1920, height: 1080 },
    { name: "06-board-desktop", width: 1280, height: 800 },
    { name: "07-board-tablet", width: 820, height: 1180 },
    { name: "08-board-phone", width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(350);
    await shot(viewport.name, { fullPage: true });
  }

  // Sin scroll horizontal ni vertical en TV / escritorio / tablet.
  for (const viewport of viewports.slice(0, 3)) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - window.innerWidth,
      y: document.documentElement.scrollHeight - window.innerHeight,
    }));
    check(
      `sin desborde en ${viewport.name}`,
      overflow.x <= 1 && overflow.y <= 1,
      JSON.stringify(overflow),
    );
  }

  // ---------- 6. Polling en vivo ----------
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE + boardPath, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const admin = await context.newPage();
  await admin.goto(`${BASE}/agenda/nueva`, { waitUntil: "networkidle" });
  await admin.fill("#title", "Llamar al plomero");
  await admin.getByRole("button", { name: "Toda la familia", exact: true }).click();
  await admin.getByRole("button", { name: "Otros", exact: true }).click();
  await admin.getByRole("button", { name: "Guardar actividad" }).click();
  await admin.waitForURL("**/agenda*");
  await admin.close();

  let polled = false;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    if ((await page.getByText("Llamar al plomero").count()) > 0) {
      polled = true;
      break;
    }
    await page.waitForTimeout(1000);
  }
  check("el tablero se actualiza solo (polling)", polled);

  // ---------- 7. Eliminar una actividad y una fecha recurrente ----------
  await page.goto(`${BASE}/agenda`, { waitUntil: "networkidle" });

  const plumberRow = page
    .locator("div.card", { hasText: "Llamar al plomero" })
    .first();
  check(
    "la actividad de una sola vez está en la agenda",
    (await plumberRow.count()) === 1,
  );
  await plumberRow
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await shot("08b-confirmar-eliminacion");
  await plumberRow
    .getByRole("button", { name: "Sí, eliminar", exact: true })
    .click();

  let gone = false;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if ((await page.getByText("Llamar al plomero").count()) === 0) {
      gone = true;
      break;
    }
    await page.waitForTimeout(600);
  }
  check("la actividad eliminada desaparece de la agenda", gone);

  const boardAfterDelete = await context.request.get(
    `${BASE}/api/board?token=${token}`,
  );
  const deleteJson = await boardAfterDelete.json();
  check(
    "la actividad eliminada no aparece en el tablero",
    !deleteJson.days[0].items.some((item) => item.title === "Llamar al plomero"),
  );

  const guitarCards = page.locator("div.card", {
    hasText: "Clase de guitarra",
  });
  const guitarBefore = await guitarCards.count();
  check(
    "la actividad recurrente tiene varias fechas",
    guitarBefore >= 2,
    `cards=${guitarBefore}`,
  );

  const todayGuitar = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Hoy", exact: true }) })
    .locator("div.card", { hasText: "Clase de guitarra" })
    .first();
  await todayGuitar
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await todayGuitar
    .getByRole("button", { name: "Sí, eliminar", exact: true })
    .click();

  let guitarAfter = guitarBefore;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    guitarAfter = await guitarCards.count();
    if (guitarAfter === guitarBefore - 1) break;
    await page.waitForTimeout(600);
  }
  check(
    "solo se elimina la fecha elegida de la repetición",
    guitarAfter === guitarBefore - 1,
    `cards=${guitarAfter}`,
  );

  const boardAfterRecurring = await context.request.get(
    `${BASE}/api/board?token=${token}`,
  );
  const recurringJson = await boardAfterRecurring.json();
  check(
    "la fecha recurrente eliminada no aparece en el tablero",
    !recurringJson.days[0].items.some(
      (item) => item.title === "Clase de guitarra",
    ),
  );

  // ---------- 8. Completar e historial ----------
  await page.goto(`${BASE}/agenda?ver=historial`, { waitUntil: "networkidle" });
  const historyRow = page
    .locator("div.card", { hasText: "Compra de útiles" })
    .first();
  check("el historial lista la actividad pasada", (await historyRow.count()) === 1);
  await historyRow.getByRole("button", { name: "Marcar como completada" }).click();

  let marked = false;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if ((await page.getByText("Lista").count()) > 0) {
      marked = true;
      break;
    }
    await page.waitForTimeout(600);
  }
  check("la actividad queda marcada como lista", marked);
  await shot("09-historial", { fullPage: true });

  // Agregar dos más al historial para ver densidad
  for (const title of ["Reunión de consorcio", "Turno con el dentista"]) {
    await page.goto(`${BASE}/agenda/nueva`, { waitUntil: "networkidle" });
    await page.fill("#title", title);
    await page.fill("#date", isoDate(-1));
    await page.getByRole("button", { name: "Toda la familia", exact: true }).click();
    await page.getByRole("button", { name: "Guardar actividad" }).click();
    await page.waitForURL("**/agenda*");
  }
  await page.goto(`${BASE}/agenda?ver=historial`, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await shot("10-historial-phone", { fullPage: true });

  // ---------- 9. Agenda y formulario en teléfono ----------
  await page.goto(`${BASE}/agenda`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot("11-agenda-phone", { fullPage: true });

  await page.goto(`${BASE}/agenda/nueva`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot("12-form-phone", { fullPage: true });

  // ---------- 10. Tablero sin datos de hoy ----------
  await page.setViewportSize({ width: 1280, height: 900 });
  const emptyBoard = await context.newPage();
  await emptyBoard.goto(BASE + boardPath, { waitUntil: "networkidle" });
  const itemCount = await emptyBoard
    .locator("section[aria-label='Actividades de hoy'] article")
    .count();
  check("el tablero sigue mostrando actividades de hoy", itemCount >= 2, `items=${itemCount}`);
  await emptyBoard.close();

  // ---------- 11. Acceso inválido ----------
  const errorsBeforeInvalid = errors.length;

  const invalidPage = await context.newPage();
  const invalidResponse = await invalidPage.goto(`${BASE}/b/tokeninvalido123`, {
    waitUntil: "networkidle",
  });
  check(
    "token inválido devuelve 404",
    invalidResponse?.status() === 404,
    `status=${invalidResponse?.status()}`,
  );
  const apiNoToken = await context.request.get(`${BASE}/api/board`);
  check("API sin token devuelve 401", apiNoToken.status() === 401, `status=${apiNoToken.status()}`);
  const apiBadToken = await context.request.get(`${BASE}/api/board?token=nope`);
  check(
    "API con token inválido devuelve 401",
    apiBadToken.status() === 401,
    `status=${apiBadToken.status()}`,
  );
  await invalidPage.close();
  errors.splice(errorsBeforeInvalid);

  // ---------- 12. Export ----------
  const exportResponse = await context.request.get(`${BASE}/api/export`);
  const exportBody = await exportResponse.text();
  let exportJson = {};
  try {
    exportJson = JSON.parse(exportBody);
  } catch {
    exportJson = {};
  }
  check("export devuelve JSON con datos", exportResponse.status() === 200, `status=${exportResponse.status()}`);
  check(
    "el export incluye actividades",
    Array.isArray(exportJson.activities) && exportJson.activities.length >= 8,
    `activities=${exportJson.activities?.length}`,
  );

  // ---------- 13. Cambio de contraseña ----------
  await page.goto(`${BASE}/ajustes`, { waitUntil: "networkidle" });
  await page.fill('input[name="currentPassword"]', PASSWORD);
  await page.fill('input[name="newPassword"]', NEW_PASSWORD);
  await page.fill('input[name="repeatPassword"]', NEW_PASSWORD);
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await page.waitForTimeout(1500);
  check(
    "avisa que la contraseña cambió",
    (await page.getByText("Contraseña actualizada").count()) > 0,
  );

  const freshContext = await browser.newContext();
  const loginPage = await freshContext.newPage();
  await loginPage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await loginPage.fill("#username", "martin");
  await loginPage.fill("#password", NEW_PASSWORD);
  await loginPage.getByRole("button", { name: "Entrar al panel" }).click();
  await loginPage.waitForURL("**/agenda*", { timeout: 15000 });
  check("login con la contraseña nueva", loginPage.url().includes("/agenda"));
  await freshContext.close();

  // ---------- Resultados ----------
  const failed = checks.filter((item) => !item.ok);
  console.log("\nchecks:", checks.length - failed.length, "/", checks.length);
  if (failed.length > 0) {
    console.log("failed:", JSON.stringify(failed, null, 2));
    process.exitCode = 1;
  }
  console.log("console errors:", JSON.stringify(errors, null, 2));
  if (errors.length > 0) process.exitCode = 1;
  console.log("DONE");
} catch (error) {
  await shot("error", { fullPage: true });
  console.error("FAILED:", error);
  console.error("page:", page.url());
  console.error("errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
