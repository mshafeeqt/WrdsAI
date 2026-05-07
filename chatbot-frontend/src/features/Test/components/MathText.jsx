import React from 'react';

const LATEX_SYMBOLS = {
  '\\theta': 'θ',
  '\\pi': 'π',
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\lambda': 'λ',
  '\\phi': 'φ',
  '\\mu': 'μ',
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\pm': '±',
  '\\times': '×',
  '\\div': '÷',
  '\\cdot': '·',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\neq': '≠'
};

function normalizeChemicalFormula(text) {
  let result = String(text || '').replace(/->/g, '→');
  
  // Safely subscript any numbers that immediately follow a chemical element symbol (e.g. H, He, C) 
  // or a closing parenthesis, by wrapping them in {} so the script reader limits the scope to just the number.
  result = result.replace(/([A-Z][a-z]?|\))(\d+)/g, '$1_{$2}');
  
  return result;
}

function replaceLatexCommands(text) {
  let result = String(text || '');

  Object.entries(LATEX_SYMBOLS).forEach(([latex, symbol]) => {
    result = result.replaceAll(latex, symbol);
  });

  result = result
    .replace(/\\sin\b/g, 'sin')
    .replace(/\\cos\b/g, 'cos')
    .replace(/\\tan\b/g, 'tan')
    .replace(/\\cot\b/g, 'cot')
    .replace(/\\sec\b/g, 'sec')
    .replace(/\\cosec\b/g, 'cosec')
    .replace(/\\log\b/g, 'log')
    .replace(/\\ln\b/g, 'ln')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s*\(([^()]+)\)/g, '√($1)')
    .replace(/\bsqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\bsqrt\s*\(([^()]+)\)/g, '√($1)')
    .replace(/\bsqrt\s+([A-Za-z0-9]+)/g, '√$1');

  return normalizeChemicalFormula(result);
}

function readScriptValue(text, startIndex) {
  if (text[startIndex] === '{') {
    let depth = 1;
    let index = startIndex + 1;
    let value = '';

    while (index < text.length && depth > 0) {
      const char = text[index];
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }

      if (depth > 0) {
        value += char;
      }
      index += 1;
    }

    return { value, nextIndex: index };
  }

  let index = startIndex;
  let value = '';

  while (index < text.length && /[A-Za-z0-9+\-=/().]/.test(text[index])) {
    value += text[index];
    index += 1;
  }

  return { value, nextIndex: index };
}

function renderMathNodes(text) {
  const normalized = replaceLatexCommands(text);
  const nodes = [];
  let buffer = '';
  let index = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    nodes.push(buffer);
    buffer = '';
  };

  while (index < normalized.length) {
    const char = normalized[index];

    if ((char === '^' || char === '_') && index + 1 < normalized.length) {
      const { value, nextIndex } = readScriptValue(normalized, index + 1);
      if (value) {
        flushBuffer();
        const Tag = char === '^' ? 'sup' : 'sub';
        nodes.push(
          <Tag key={`${char}-${index}`} className="math-script">
            {renderMathNodes(value)}
          </Tag>
        );
        index = nextIndex;
        continue;
      }
    }

    buffer += char;
    index += 1;
  }

  flushBuffer();
  return nodes;
}

const MathText = ({ text, className = '' }) => {
  return <span className={className}>{renderMathNodes(text)}</span>;
};

export default MathText;
