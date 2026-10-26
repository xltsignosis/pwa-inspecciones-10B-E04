
import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const PORT = 3100;
const root = resolve(__dirname, "../..");

export default defineConfig({
    testDir: ".",
    testMatch: "**/*.spec.ts",
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ["list"],
        ["html", { outputFolder: resolve(root, "playwright-report"), open: "never" }],
        ["json", { outputFile: resolve(root, "reports/week08/e2e/results.json") }],
    ],
    outputDir: resolve(root, "test-results"),

    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        serviceWorkers: "allow",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],


    webServer: {
        command: process.env.E2E_SKIP_BUILD === "1"
            ? "npm run start -- -H 127.0.0.1 -p 3100"
            : "npm run build && npm run start -- -H 127.0.0.1 -p 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: false,
        timeout: 180_000,
    },

});
