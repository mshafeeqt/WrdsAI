// import multer from "multer";
// import path from "path"; // Add this import
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// // File filter function
// const fileFilter = (req, file, cb) => {
//   const allowedExtensions = [
//     ".txt",
//     ".pdf",
//     ".doc",
//     ".docx",
//     ".jpg",
//     ".jpeg",
//     ".png",
//     ".pptx",
//     ".xlsx",
//     ".csv",
//   ];

//   const fileExtension = path.extname(file.originalname).toLowerCase(); // Now path is defined

//   if (allowedExtensions.includes(fileExtension)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Invalid file type: ${fileExtension}`), false);
//   }
// };

// // Cloudinary storage configuration
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "chatbot-files",
//     format: async (req, file) => {
//       const ext = path.extname(file.originalname).toLowerCase();
//       switch (ext) {
//         case ".jpg":
//         case ".jpeg":
//           return "jpg";
//         case ".png":
//           return "png";
//         case ".pdf":
//           return "pdf";
//         case ".doc":
//         case ".docx":
//           return "docx";
//         case ".txt":
//           return "txt";
//         default:
//           return ext.replace(".", "");
//       }
//     },
//     public_id: (req, file) => {
//       const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       return name;
//     },
//   },
// });

// // Multer upload configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 5, // Maximum 5 files
//   },
// });

// export default upload;

// -------------------------------------------------

// import multer from "multer";
// import path from "path";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// // File filter function
// const fileFilter = (req, file, cb) => {
//   const allowedExtensions = [
//     ".txt",
//     ".pdf",
//     ".doc",
//     ".docx",
//     ".jpg",
//     ".jpeg",
//     ".png",
//     ".pptx",
//     ".xlsx",
//     ".csv",
//   ];

//   const fileExtension = path.extname(file.originalname).toLowerCase();

//   if (allowedExtensions.includes(fileExtension)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Invalid file type: ${fileExtension}`), false);
//   }
// };

// // -----------------
// // const storage = new CloudinaryStorage({
// //   cloudinary: cloudinary,
// //   params: async (req, file) => {
// //     const ext = path.extname(file.originalname).toLowerCase();

// //     // Determine resource type
// //     let resource_type = "auto";
// //     if (
// //       [".pdf", ".txt", ".doc", ".docx", ".pptx", ".xlsx", ".csv"].includes(ext)
// //     ) {
// //       resource_type = "raw";
// //     }

// //     // Include extension in public_id
// //     const public_id = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

// //     return {
// //       folder: "chatbot-files",
// //       resource_type: resource_type,
// //       public_id: public_id,
// //       // For specific formats, you can set format
// //       ...(ext === ".jpg" || ext === ".jpeg" ? { format: "jpg" } : {}),
// //       ...(ext === ".png" ? { format: "png" } : {}),
// //       ...(ext === ".pdf" ? { format: "pdf" } : {}),
// //     };
// //   },
// // });

// // Updated Cloudinary storage configuration
// // const storage = new CloudinaryStorage({
// //   cloudinary,
// //   params: async (req, file) => {
// //     const ext = path.extname(file.originalname).toLowerCase();

// //     let resource_type = "auto";
// //     if (
// //       [".pdf", ".txt", ".doc", ".docx", ".pptx", ".xlsx", ".csv"].includes(ext)
// //     ) {
// //       resource_type = "raw";
// //     }

// //     return {
// //       folder: "chatbot-files",
// //       resource_type,
// //       public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
// //       type: "upload", // 🔥 ensures it’s accessible without signing
// //       access_mode: "public", // 🔥 important for browser access
// //     };
// //   },
// // });
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const ext = path.extname(file.originalname).toLowerCase();

//     let resourceType = "auto"; // 👈 keep auto so browser can open

//     return {
//       folder: "chatbot-files",
//       resource_type: resourceType, // 👈 raw no use karo
//       public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
//       type: "upload",
//       access_mode: "public", // 👈 ensures browser access
//       format: ext.replace(".", ""), // keep extension
//     };
//   },
// });

// // Multer upload configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 5, // Maximum 5 files
//   },
// });

// export default upload;

// -----------------------------------------------------------

// import multer from "multer";
// import path from "path";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// // Allowed file extensions
// const fileFilter = (req, file, cb) => {
//   const allowedExtensions = [
//     ".txt",
//     ".pdf",
//     ".doc",
//     ".docx",
//     ".jpg",
//     ".jpeg",
//     ".png",
//     ".pptx",
//     ".xlsx",
//     ".csv",
//   ];
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (allowedExtensions.includes(ext)) cb(null, true);
//   else cb(new Error(`Invalid file type: ${ext}`), false);
// };

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const resourceType = [
//       ".pdf",
//       ".txt",
//       ".doc",
//       ".docx",
//       ".pptx",
//       ".xlsx",
//       ".csv",
//     ].includes(ext)
//       ? "raw"
//       : "auto";
//     return {
//       folder: "chatbot-files",
//       resource_type: resourceType,
//       public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
//       type: "upload",
//       access_mode: "public",
//     };
//   },
// });

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024, files: 5 },
// });

// export default upload;

import multer from "multer";
import path from "path";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10);
const maxFiles = Number(process.env.UPLOAD_MAX_FILES || 5);
const maxFileSizeBytes = Math.max(1, maxFileSizeMb) * 1024 * 1024;
const maxFileCount = Math.max(1, maxFiles);

const allowedFileTypes = {
  ".txt": ["text/plain"],
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".csv": ["text/csv", "application/csv", "application/vnd.ms-excel"],
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = allowedFileTypes[ext];

  if (!allowedMimeTypes) {
    cb(new Error(`Invalid file type: ${ext}`), false);
    return;
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error(`Invalid file MIME type: ${file.mimetype}`), false);
    return;
  }

  cb(null, true);
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const resourceType = [
      ".pdf",
      ".txt",
      ".doc",
      ".docx",
      ".pptx",
      ".xlsx",
      ".csv",
    ].includes(ext)
      ? "raw"
      : "auto";
    return {
      folder: "chatbot-files",
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
      type: "upload",
      access_mode: "public",
    };
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeBytes,
    files: maxFileCount,
    fields: 30,
    fieldNameSize: 100,
    fieldSize: 256 * 1024,
  },
});

export default upload;
