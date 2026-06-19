import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveBackendBasePath() {
  const candidates = [
    path.resolve(__dirname, ".."),
    path.join(process.cwd(), "chatbot-backend"),
    path.join(process.cwd(), "CARBON_CHATBOT", "chatbot-backend"),
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "Math_Data"))) {
      return candidate;
    }
  }

  return path.resolve(__dirname, "..");
}

function getClassSortOrder(className = "") {
  const match = String(className).match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortClassDirectories(entries = []) {
  return [...entries].sort((a, b) => {
    const classDiff = getClassSortOrder(a.name) - getClassSortOrder(b.name);
    if (classDiff !== 0) return classDiff;
    return a.name.localeCompare(b.name);
  });
}

function isClassDirectory(entry) {
  return entry.isDirectory() && /^Class\s+\d+$/i.test(entry.name);
}

const SUBJECT_SORT_PRIORITY = ["Science", "Maths", "Mathematics"];

function getSubjectSortOrder(subjectName = "") {
  const normalizedName = String(subjectName).trim().toLowerCase();
  const index = SUBJECT_SORT_PRIORITY.findIndex(
    (entry) => entry.toLowerCase() === normalizedName,
  );
  return index === -1 ? SUBJECT_SORT_PRIORITY.length : index;
}

function sortSubjectDirectories(entries = []) {
  return [...entries].sort((a, b) => {
    const subjectDiff = getSubjectSortOrder(a.name) - getSubjectSortOrder(b.name);
    if (subjectDiff !== 0) return subjectDiff;
    return a.name.localeCompare(b.name);
  });
}

export const getMathChapters = async (_req, res) => {
  try {
    const basePath = resolveBackendBasePath();
    const mathDataDir = path.join(basePath, "Math_Data");

    if (!fs.existsSync(mathDataDir)) {
      return res.status(404).json({
        success: false,
        message: "Math_Data folder not found",
        chapters: [],
      });
    }

    const structure = [];
    const chapters = [];

    const classDirs = sortClassDirectories(
      fs
      .readdirSync(mathDataDir, { withFileTypes: true })
      .filter(isClassDirectory)
    );

    for (const classDir of classDirs) {
      const classPath = path.join(mathDataDir, classDir.name);
      const subjectDirs = sortSubjectDirectories(
        fs
        .readdirSync(classPath, { withFileTypes: true })
        .filter((entry) => {
          if (!entry.isDirectory()) return false;
          const subjectPath = path.join(classPath, entry.name);
          return fs
            .readdirSync(subjectPath, { withFileTypes: true })
            .some((subjectEntry) =>
              subjectEntry.isFile() && subjectEntry.name.toLowerCase().endsWith(".pdf"),
            );
        })
      );

      const subjects = subjectDirs.map((subjectDir) => {
        const subjectPath = path.join(classPath, subjectDir.name);
        const subjectChapters = fs
          .readdirSync(subjectPath, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((file) => {
            const name = file.name.replace(/\.pdf$/i, "");
            const id = `${classDir.name}/${subjectDir.name}/${name}`;
            const chapter = {
              id,
              name,
              fileName: file.name,
              className: classDir.name,
              subjectName: subjectDir.name,
            };
            chapters.push(chapter);
            return chapter;
          });

        return {
          id: `${classDir.name}/${subjectDir.name}`,
          name: subjectDir.name,
          className: classDir.name,
          chapters: subjectChapters,
        };
      });

      if (!subjects.length) {
        continue;
      }

      structure.push({
        id: classDir.name,
        name: classDir.name,
        subjects,
      });
    }

    return res.json({
      success: true,
      count: chapters.length,
      structure,
      chapters,
    });
  } catch (error) {
    console.error("getMathChapters error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load chapter list",
      chapters: [],
    });
  }
};
