import assert from "node:assert/strict";

type PositionRequest = Geolocation["getCurrentPosition"];

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value });
}

function mockGeolocation(getCurrentPosition: PositionRequest) {
  setNavigator({
    geolocation: {
      getCurrentPosition,
      watchPosition: () => assert.fail("No debe haber seguimiento en segundo plano"),
    },
    permissions: {
      query: () => assert.fail("No se deben consultar permisos antes de la acción del usuario"),
    },
  });
}

async function run() {
  let requests = 0;
  const position = {
    coords: {
      latitude: 10,
      longitude: 20,
      accuracy: 25,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: 0,
    toJSON: () => ({}),
  };

  // Importación y detección de soporte son inertes, incluso con la API presente.
  mockGeolocation((success, _error, options) => {
    requests += 1;
    assert.deepEqual(options, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 0 });
    success(position);
  });
  const { getCurrentLocation, isGeolocationSupported } = await import("../src/lib/device/geolocation");
  assert.equal(isGeolocationSupported(), true);
  assert.equal(requests, 0, "Cargar el módulo no debe pedir ubicación");
  assert.deepEqual(await getCurrentLocation(), {
    status: "granted",
    coords: { latitude: 10, longitude: 20, accuracy: 25 },
  });
  assert.equal(requests, 1, "Cada acción debe solicitar una única lectura");

  // SSR, API ausente y API incompleta permiten continuar con captura manual.
  for (const navigatorValue of [undefined, {}, { geolocation: {} }]) {
    setNavigator(navigatorValue);
    assert.equal(isGeolocationSupported(), false);
    const result = await getCurrentLocation();
    assert.equal(result.status, "unavailable");
    assert.equal(result.fallback, "manual");
    assert.match(result.message, /manualmente/);
  }

  // Denegación, posición no disponible y timeout se distinguen sin rechazar la promesa.
  for (const code of [1, 2, 3]) {
    mockGeolocation((_success, error) => {
      assert.ok(error);
      error({ code, message: "Fallo sintético", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    const result = await getCurrentLocation();
    assert.equal(result.status, code === 1 ? "denied" : "unavailable");
    assert.equal(result.fallback, "manual");
    assert.match(result.message, /edificio, zona o referencia manualmente/);
    assert.equal("coords" in result, false);
  }

  // Un fallo síncrono también devuelve un resultado recuperable.
  for (const error of [new Error("Fallo sintético"), new DOMException("Bloqueado", "SecurityError")]) {
    mockGeolocation(() => { throw error; });
    const result = await getCurrentLocation();
    assert.equal(result.status, error.name === "SecurityError" ? "denied" : "unavailable");
    assert.equal(result.fallback, "manual");
  }

  // La solicitud puede resolverse más tarde; no se adelanta un éxito ficticio.
  let complete: PositionCallback | undefined;
  mockGeolocation((success) => { complete = success; });
  const pending = getCurrentLocation();
  let settled = false;
  void pending.then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  assert.ok(complete);
  complete(position);
  assert.equal((await pending).status, "granted");

  console.log("geolocation.spec.ts: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else Reflect.deleteProperty(globalThis, "navigator");
});
