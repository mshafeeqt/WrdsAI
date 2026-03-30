
function normalizeMathText(text) {
    if (!text) return "";

    let out = text;

    // Map 0-9 to unicode superscripts
    const superscripts = {
        0: "⁰",
        1: "¹",
        2: "²",
        3: "³",
        4: "⁴",
        5: "⁵",
        6: "⁶",
        7: "⁷",
        8: "⁸",
        9: "⁹",
    };

    // Convert n^2, x^2, (expr)^2 pattern to unicode
    // 1. Convert simple number superscripts: ^1, ^2, ^3...
    out = out.replace(/\^(\d+)/g, (_, num) =>
        num
            .split("")
            .map((n) => superscripts[n] || n)
            .join("")
    );

    return out;
}

const testCases = [
    "n^2",
    "x^3 + y^3",
    "(x+y)^2",
    "Area = 4 * pi * r^2",
    "No power here",
    "Power ^123",
    "Mixed 2^3 and 3^4"
];

testCases.forEach(t => {
    console.log(`Original: "${t}" -> Normalized: "${normalizeMathText(t)}"`);
});
