const SCIENCE_MATHS_SUBJECTS = new Set(["maths", "math", "science"]);

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.id || item?.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

export function extractClassNumbers(value = "") {
  return [...String(value).matchAll(/\d+/g)].map((match) => match[0]);
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

export function getStudentClassChoices(structure = [], user, teacherMode = false) {
  if (teacherMode || !isStudentUser(user) || !Array.isArray(structure)) return [];

  const className = getUserClassName(user);
  const classNumbers = extractClassNumbers(className);

  if (classNumbers.length > 1) {
    return uniqueById(
      classNumbers
        .map((classNumber) => findClassByName(structure, classNumber))
        .filter(Boolean),
    );
  }

  const singleClass = findClassByName(structure, className);
  return singleClass ? [singleClass] : [];
}

export function getLockedStudentClass(structure = [], user, teacherMode = false) {
  const choices = getStudentClassChoices(structure, user, teacherMode);
  return choices.length === 1 ? choices[0] : null;
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