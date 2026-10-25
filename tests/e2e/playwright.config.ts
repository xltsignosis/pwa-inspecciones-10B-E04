
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
    testDir: ".",
    testMatch: "**/*.spec.ts",
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: "list",

    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: "retain-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],


    webServer: {
        command: "npm run build && npm run start -- -p 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },

});
