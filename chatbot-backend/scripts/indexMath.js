import { indexMathData } from "../utils/ragHelper.js";

async function main() {
    try {
        await indexMathData();
        console.log("🚀 Indexing COMPLETE!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Indexing FAILED:", err.message);
        process.exit(1);
    }
}

main();
