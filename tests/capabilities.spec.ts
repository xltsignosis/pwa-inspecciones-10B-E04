import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspections } from "../src/lib/data/inspections";

// Los tres módulos se prueban en Node con APIs simuladas y datos sintéticos:
// no se abre ningún diálogo real de permisos ni se usa red.

type Camera = typeof import("../src/lib/device/camera");
type Location = typeof import("../src/lib/device/geolocation");
type Notifications = typeof import("../src/lib/notifications/client");

const root = resolve(import.meta.dirname, "..");
const GLOBALS = ["navigator", "Notification", "document"] as const;
const originals = GLOBALS.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);

function setGlobal(key: (typeof GLOBALS)[number], value: unknown) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}

function restoreGlobals() {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
}

/** Simula un navegador sin ninguna de las tres APIs (o un render en servidor). */
function withoutApis() {
  setGlobal("navigator", {});
  Reflect.deleteProperty(globalThis, "Notification");
}

function mockNotification(
  initial: NotificationPermission,
  answer: NotificationPermission = initial,
  { throwOnCreate = false } = {},
) {
  const log = { requests: 0, shown: [] as { title: string; options?: NotificationOptions }[] };
  class FakeNotification {
    static permission: NotificationPermission = initial;
    static async requestPermission() {
      log.requests += 1;
      FakeNotification.permission = answer;
      return answer;
    }
    constructor(title: string, options?: NotificationOptions) {
      if (throwOnCreate) throw new TypeError("Illegal constructor");
      log.shown.push({ title, options });
    }
  }
  setGlobal("Notification", FakeNotification);
  return log;
}

function mockCamera(getUserMedia: (constraints: MediaStreamConstraints) => Promise<unknown>) {
  setGlobal("navigator", { mediaDevices: { getUserMedia } });
}

/** Stream y elementos mínimos para que la captura llegue a producir un Blob. */
function mockCaptureDom({ width = 640, height = 480 } = {}) {
  const log = { stopped: 0 };
  const stream = { getTracks: () => [{ stop: () => (log.stopped += 1) }] };
  setGlobal("document", {
    createElement: (tag: string) =>
      tag === "video"
        ? { play: async () => {}, videoWidth: width, videoHeight: height }
        : {
            getContext: () => ({ drawImage: () => {} }),
            toBlob: (done: BlobCallback, type: string) => done(new Blob(["foto sintética"], { type })),
          },
  });
  return { log, stream };
}

function mockGeolocation(getCurrentPosition: Geolocation["getCurrentPosition"]) {
  setGlobal("navigator", { geolocation: { getCurrentPosition } });
}

const change = {
  inspectionId: inspections[1].id,
  location: inspections[1].location,
  statusLabel: "Sin incidencias",
};

let camera: Camera;
let location: Location;
let notifications: Notifications;

const cases: [string, () => Promise<void>][] = [];
const test = (name: string, fn: () => Promise<void>) => cases.push([name, fn]);

test("importar los módulos y consultar soporte no pide ningún permiso", async () => {
  let prompts = 0;
  const prompt = () => {
    prompts += 1;
    return new Promise<never>(() => {});
  };
  setGlobal("navigator", {
    mediaDevices: { getUserMedia: prompt },
    geolocation: { getCurrentPosition: prompt, watchPosition: prompt },
    permissions: { query: prompt },
  });
  const notificationLog = mockNotification("default");

  camera = await import("../src/lib/device/camera");
  location = await import("../src/lib/device/geolocation");
  notifications = await import("../src/lib/notifications/client");

  assert.equal(typeof camera.captureEvidence, "function");
  assert.equal(typeof location.getCurrentLocation, "function");
  assert.equal(typeof notifications.notifyStatusChange, "function");

  assert.equal(camera.isCameraSupported(), true);
  assert.equal(location.isGeolocationSupported(), true);
  assert.equal(notifications.isNotificationSupported(), true);
  assert.equal(notifications.getNotificationPermission(), "default");

  assert.equal(prompts, 0, "Cargar los módulos no debe abrir cámara, ubicación ni permisos");
  assert.equal(notificationLog.requests, 0, "Consultar el permiso no debe pedirlo");
});

test("sin las APIs ninguna función lanza y cada una devuelve su alternativa", async () => {
  for (const setup of [withoutApis, () => Reflect.deleteProperty(globalThis, "navigator")]) {
    setup();
    Reflect.deleteProperty(globalThis, "Notification");

    assert.equal(camera.isCameraSupported(), false);
    assert.deepEqual(await camera.captureEvidence(), { status: "unavailable" });

    assert.equal(location.isGeolocationSupported(), false);
    const place = await location.getCurrentLocation();
    assert.equal(place.status, "unavailable");
    assert.equal("fallback" in place && place.fallback, "manual");

    assert.equal(notifications.isNotificationSupported(), false);
    assert.equal(notifications.getNotificationPermission(), "unsupported");
    const notice = await notifications.notifyStatusChange(change);
    assert.equal(notice.status, "unavailable");
    assert.equal("fallback" in notice && notice.fallback, "in-app");
    assert.match(notice.message, /Laboratorio de Electrónica.*Sin incidencias/);
  }
});

test("cámara: el permiso denegado y los fallos del dispositivo no rompen el flujo", async () => {
  for (const [name, expected] of [
    ["NotAllowedError", "denied"],
    ["SecurityError", "denied"],
    ["NotFoundError", "unavailable"],
    ["NotReadableError", "unavailable"],
  ] as const) {
    mockCamera(() => Promise.reject(new DOMException("Fallo sintético", name)));
    assert.deepEqual(await camera.captureEvidence(), { status: expected }, name);
  }

  mockCamera(() => Promise.reject(new Error("Fallo sintético")));
  assert.deepEqual(await camera.captureEvidence(), { status: "unavailable" });
});

test("cámara: captura una imagen, pide solo video y siempre apaga la cámara", async () => {
  const { log, stream } = mockCaptureDom();
  let requested: MediaStreamConstraints | undefined;
  mockCamera(async (constraints) => {
    requested = constraints;
    return stream;
  });

  const result = await camera.captureEvidence();
  assert.equal(result.status, "captured");
  assert.ok(result.status === "captured" && result.blob instanceof Blob);
  assert.equal(result.status === "captured" && result.blob.type, "image/jpeg");
  assert.deepEqual(requested, { video: { facingMode: "environment" }, audio: false }, "No debe pedir micrófono");
  assert.equal(log.stopped, 1, "La cámara debe apagarse después de capturar");

  // Un stream sin imagen útil tampoco deja la cámara encendida.
  const empty = mockCaptureDom({ width: 0, height: 0 });
  mockCamera(async () => empty.stream);
  assert.deepEqual(await camera.captureEvidence(), { status: "unavailable" });
  assert.equal(empty.log.stopped, 1);
});

test("ubicación: devuelve solo coordenadas y precisión, o la captura manual", async () => {
  // El dispositivo entrega más datos (altitud, rumbo, velocidad) de los que se devuelven.
  const position = {
    coords: {
      latitude: 18.4,
      longitude: -97.3,
      accuracy: 40,
      altitude: 1600,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 1.2,
      toJSON: () => ({}),
    },
    timestamp: 0,
    toJSON: () => ({}),
  };
  mockGeolocation((success) => success(position));
  assert.deepEqual(await location.getCurrentLocation(), {
    status: "granted",
    coords: { latitude: 18.4, longitude: -97.3, accuracy: 40 },
  });

  for (const [code, expected] of [[1, "denied"], [2, "unavailable"], [3, "unavailable"]] as const) {
    mockGeolocation((_success, error) =>
      error?.({ code, message: "Fallo sintético", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
    );
    const result = await location.getCurrentLocation();
    assert.equal(result.status, expected);
    assert.equal("fallback" in result && result.fallback, "manual");
    assert.equal("coords" in result, false, "Un fallo no debe inventar coordenadas");
  }
});

test("notificaciones: con permiso denegado no se vuelve a pedir y el cambio se muestra en la app", async () => {
  const log = mockNotification("denied");

  const result = await notifications.notifyStatusChange(change);
  assert.deepEqual(result, {
    status: "denied",
    fallback: "in-app",
    message: notifications.describeStatusChange(change),
  });
  assert.equal(log.requests, 0);
  assert.equal(log.shown.length, 0);
});

test("notificaciones: el permiso se pide una sola vez, en el primer cambio de estado", async () => {
  const log = mockNotification("default", "granted");

  assert.equal((await notifications.notifyStatusChange(change)).status, "shown");
  assert.equal((await notifications.notifyStatusChange(change)).status, "shown");
  assert.equal(log.requests, 1, "Con el permiso ya concedido no se vuelve a preguntar");
  assert.equal(log.shown.length, 2);
});

test("notificaciones: el aviso del sistema lleva solo laboratorio y estado nuevo", async () => {
  const log = mockNotification("granted");

  const result = await notifications.notifyStatusChange(change);
  assert.equal(result.status, "shown");
  assert.equal(log.requests, 0);

  const [{ title, options }] = log.shown;
  assert.equal(title, "Inspección actualizada");
  assert.equal(options?.body, result.message);
  assert.equal(options?.tag, change.inspectionId);
  assert.deepEqual(options?.data, { url: `/inspecciones/${change.inspectionId}` });
  assert.deepEqual(Object.keys(options ?? {}).sort(), ["body", "data", "tag"]);

  const text = JSON.stringify(log.shown);
  assert.doesNotMatch(text, new RegExp(inspections[1].inspector), "No debe exponer al responsable");
  assert.doesNotMatch(text, new RegExp(inspections[1].summary), "No debe exponer el detalle de la inspección");
});

test("notificaciones: usa el service worker activo y sobrevive a un constructor que falla", async () => {
  // Chrome en Android: el constructor lanza, pero el service worker sí notifica.
  const log = mockNotification("granted", "granted", { throwOnCreate: true });
  const viaWorker: string[] = [];
  setGlobal("navigator", {
    serviceWorker: {
      getRegistration: async () => ({
        active: {},
        showNotification: async (title: string) => void viaWorker.push(title),
      }),
    },
  });
  assert.equal((await notifications.notifyStatusChange(change)).status, "shown");
  assert.deepEqual(viaWorker, ["Inspección actualizada"]);
  assert.equal(log.shown.length, 0);

  // Sin service worker y con el constructor bloqueado queda el aviso en la app.
  setGlobal("navigator", {});
  const result = await notifications.notifyStatusChange(change);
  assert.equal(result.status, "unavailable");
  assert.equal("fallback" in result && result.fallback, "in-app");
  assert.equal(result.message, notifications.describeStatusChange(change));
});

// Va al final de los casos de notificaciones: deja marcada la sesión como
// "ya se preguntó", que es justo lo que comprueba.
test("notificaciones: si la persona cierra el aviso no se insiste en la misma sesión", async () => {
  const log = mockNotification("default", "default");

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await notifications.notifyStatusChange(change);
    assert.equal(result.status, "denied");
    assert.equal("fallback" in result && result.fallback, "in-app");
  }
  assert.equal(log.requests, 1);
  assert.equal(log.shown.length, 0);
});

test("la interfaz solo usa las capacidades desde un botón, nunca al cargar", async () => {
  const read = (file: string) => readFile(resolve(root, file), "utf8");
  const capabilityCall =
    /requestPermission|getUserMedia|getCurrentPosition|captureEvidence|getCurrentLocation|notifyStatusChange/;

  for (const file of [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/inspecciones/page.tsx",
    "src/components/app-shell.tsx",
    "src/components/service-worker-registrar.tsx",
    "src/components/sync-registrar.tsx",
    "src/lib/pwa/register-service-worker.ts",
  ]) {
    assert.doesNotMatch(await read(file), capabilityCall, `${file} se ejecuta al cargar y no debe pedir permisos`);
  }

  const panel = await read("src/components/inspection-capabilities.tsx");
  for (const [handler, call] of [
    ["handleAttachPhoto", "captureEvidence"],
    ["handleUseLocation", "getCurrentLocation"],
    ["handleStatusChange", "notifyStatusChange"],
  ]) {
    assert.match(panel, new RegExp(`onClick=\\{${handler}\\}`), `${handler} debe dispararse con un clic`);
    assert.equal(panel.split(`${call}(`).length - 1, 1, `${call} debe llamarse en un solo lugar`);
    assert.match(
      panel,
      new RegExp(`async function ${handler}\\(\\) \\{[^]*?await ${call}\\(`),
      `${call} debe vivir dentro de ${handler}`,
    );
  }
  for (const effect of panel.match(/useEffect\(\(\) => \{[^]*?\n  \}, \[[^\]]*\]\);/g) ?? []) {
    assert.doesNotMatch(effect, capabilityCall, "Ningún efecto de montaje debe usar las capacidades");
  }

  // El campo manual y el aviso en la app existen aunque no haya permisos.
  assert.match(panel, /type="text"/, "La ubicación debe poder escribirse a mano");
  assert.match(panel, /type="file"[^>]*accept="image\/\*"/, "Debe poder elegirse una imagen sin la cámara");
  assert.match(panel, /role="status"[^>]*aria-live="polite"/, "El cambio debe anunciarse dentro de la app");
});

async function run() {
  for (const [name, fn] of cases) {
    try {
      await fn();
    } finally {
      restoreGlobals();
    }
    console.log(`  ok - ${name}`);
  }
  console.log(`capabilities.spec.ts: PASS (${cases.length} casos)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
