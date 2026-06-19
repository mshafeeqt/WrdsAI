const SCIENCE_MATHS_SUBJECTS = new Set(["maths", "math", "science"]);

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

export function getUserClassName(user) {
  return (
    user?.className ||
    user?.class_name ||
    user?.class ||
    user?.standard ||
    user?.grade ||
    ""
  );
}

export function extractClassNumber(value = "") {
  const match = String(value).match(/\d+/);
  return match ? match[0] : "";
}

export function isStudentUser(user) {
  const role = user?.userRole || user?.role || user?.user_type || user?.type;
  return normalizeText(role) === "student";
}

export function findClassByName(structure = [], className = "") {
  if (!Array.isArray(structure) || !className) return null;

  const normalizedTarget = normalizeText(className);
  const classNumber = extractClassNumber(className);

  return (
    structure.find((item) => normalizeText(item?.name) === normalizedTarget) ||
    structure.find((item) => extractClassNumber(item?.name) === classNumber) ||
    null
  );
}

export function getLockedStudentClass(structure = [], user, teacherMode = false) {
  if (teacherMode || !isStudentUser(user)) return null;
  return findClassByName(structure, getUserClassName(user));
}

export function getVisibleSubjectsForStudent(classItem) {
  const subjects = Array.isArray(classItem?.subjects) ? classItem.subjects : [];
  const classNumber = extractClassNumber(classItem?.name);

  if (!["9", "10"].includes(classNumber)) {
    return subjects;
  }

  const filteredSubjects = subjects.filter((subject) =>
    SCIENCE_MATHS_SUBJECTS.has(normalizeText(subject?.name)),
  );

  return filteredSubjects.length ? filteredSubjects : subjects;
}
