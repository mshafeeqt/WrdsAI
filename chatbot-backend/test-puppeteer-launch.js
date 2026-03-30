
import puppeteer from "puppeteer";

(async () => {
    console.log("Attempting to launch Puppeteer...");
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
                "--disable-gpu",
            ],
        });
        console.log("Puppeteer launched successfully!");
        const page = await browser.newPage();
        console.log("New page created.");
        await browser.close();
        console.log("Browser closed. Test PASSED.");
    } catch (error) {
        console.error("Puppeteer launch FAILED:", error);
        process.exit(1);
    }
})();
