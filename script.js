/**
 * ============================================================================
 * PUMPING LEMMA SIMULATOR - GENERIC & USER-INPUT DRIVEN ENGINE
 * Formal Languages and Automata Theory
 * ============================================================================
 * Functions:
 *   - parseLanguage(input)              -> Parses & normalizes equations into generic AST
 *   - analyzeLanguage(parsedLanguage)   -> Extracts alphabet, variables, equality constraints
 *   - generateWitness(parsedLanguage, p)-> Dynamically constructs witness string for p
 *   - generateValidSplits(parsedLanguage, witness, p) -> Finds all legal xyz decompositions
 *   - pumpString(x, y, z, i)            -> Computes xy^i z
 *   - isInLanguage(parsedLanguage, str) -> Dynamic rule-based membership evaluation
 *   - generateResult(...)               -> Formal theoretical conclusion & counterexample
 *   - getLanguageExplanation(...)       -> Plain-English educational theory notes
 *   - resetExperiment()                 -> Clears simulation state cleanly
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. MATHEMATICAL HELPERS
// ----------------------------------------------------------------------------

function isPrimeNumber(n) {
  if (n < 2 || !Number.isInteger(n)) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function findFirstDivisor(n) {
  if (n < 2) return null;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return d;
  }
  return n;
}

function isPerfectSquare(n) {
  if (n < 1 || !Number.isInteger(n)) return false;
  const root = Math.round(Math.sqrt(n));
  return root * root === n;
}

function reverseString(str) {
  return str.split("").reverse().join("");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSuperscript(numOrStr) {
  const map = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "n": "ⁿ", "m": "ᵐ", "k": "ᵏ", "p": "ᵖ", "i": "ⁱ", "j": "ʲ", "r": "ᴿ"
  };
  return String(numOrStr).split("").map(ch => map[ch] || ch).join("");
}

// ----------------------------------------------------------------------------
// 2. GENERIC LANGUAGE PARSER & ANALYZER
// ----------------------------------------------------------------------------

/**
 * Parses user-defined equations into an extensible structured representation.
 * Supports:
 *   - Block sequence equations: e.g. 0^m 1^n 0^m, a^n b^n c^n, a^m b^m c^k, a^n b^m a^n, etc.
 *   - Unary prime equations: a^p | p is prime
 *   - Unary square equations: a^(i^2) | i >= 1
 *   - Palindromes: w w^R, w c w^R
 *   - Exact duplicate strings: w w, w c w
 */
function parseLanguage(input) {
  if (!input || typeof input !== "string" || input.trim() === "") {
    return {
      valid: false,
      errorTitle: "Empty Language Input",
      errorDesc: "Please enter a formal language equation or choose a predefined pattern."
    };
  }

  // 1. Normalize characters and whitespace
  let raw = input.trim();
  let s = raw;

  // Remove leading L= or l=
  s = s.replace(/^l\s*=\s*/i, "");

  // Remove outer braces { }
  s = s.replace(/^\{\s*/, "").replace(/\s*\}$/, "");

  // Replace unicode mathematical operators with standard ascii equivalents
  s = s.replace(/²/g, "^2")
       .replace(/³/g, "^3")
       .replace(/ⁿ/g, "^n")
       .replace(/ᵐ/g, "^m")
       .replace(/ᵖ/g, "^p")
       .replace(/ᵏ/g, "^k")
       .replace(/≥/g, ">=")
       .replace(/≤/g, "<=")
       .replace(/∈/g, " in ")
       .replace(/ᴿ/gi, "^r");

  // 2. Partition into expression and conditions
  let exprPart = "";
  let condPart = "";

  const splitPipe = s.split(/[|:;]/);
  exprPart = splitPipe[0].trim();
  if (splitPipe.length > 1) {
    condPart = splitPipe.slice(1).join(" ").trim().toLowerCase();
  }

  // Detect lower bound condition (>= 0 vs >= 1)
  let defaultMinVal = 0;
  if (condPart.includes(">= 1") || condPart.includes("> 0") || condPart.includes(">=1") || condPart.includes(">0")) {
    defaultMinVal = 1;
  }

  const compactExpr = exprPart.replace(/\s+/g, "");
  const lowerCompact = compactExpr.toLowerCase();

  // --------------------------------------------------------------------------
  // PATTERN TYPE 1: UNARY PRIME: a^p | p is prime
  // --------------------------------------------------------------------------
  if (
    lowerCompact.includes("prime") || condPart.includes("prime")
  ) {
    const m = compactExpr.match(/([a-zA-Z0-9])\^?([a-zA-Z0-9]+)?/);
    const sym = m ? m[1] : "a";
    const vName = (m && m[2]) ? m[2] : "p";

    return analyzeLanguage({
      valid: true,
      category: "unary_prime",
      symbol: sym,
      variable: vName,
      rawInput: raw,
      formattedName: `L = { ${sym}ᵖ | ${vName} is prime }`,
      alphabet: [sym],
      patternDisplay: `${sym}${toSuperscript(vName)} (${vName} is prime)`,
      minVal: 2
    });
  }

  // --------------------------------------------------------------------------
  // PATTERN TYPE 2: UNARY SQUARE: a^(i^2) | i >= 1
  // --------------------------------------------------------------------------
  if (
    lowerCompact.includes("^2") || lowerCompact.includes("square") || condPart.includes("square")
  ) {
    const symMatch = compactExpr.match(/^([a-zA-Z0-9])/);
    const sym = symMatch ? symMatch[1] : "a";
    const varMatch = compactExpr.match(/\(?([a-zA-Z0-9]+)\^2\)?/);
    const vName = varMatch ? varMatch[1] : "i";

    return analyzeLanguage({
      valid: true,
      category: "unary_square",
      symbol: sym,
      variable: vName,
      rawInput: raw,
      formattedName: `L = { ${sym}⁽ⁱ²⁾ | ${vName} ≥ 1 }`,
      alphabet: [sym],
      patternDisplay: `${sym}^(${vName}²) (${vName} ≥ 1)`,
      minVal: 1
    });
  }

  // --------------------------------------------------------------------------
  // PATTERN TYPE 3: PALINDROMES & DUPLICATE STRINGS (ww, ww^R, wcw^R, wcw)
  // --------------------------------------------------------------------------
  let detectedAlphabet = ["a", "b"];
  if (condPart.includes("{0,1}") || condPart.includes("{0, 1}") || condPart.includes("0,1")) {
    detectedAlphabet = ["0", "1"];
  }

  // 3A. Center-Marked Palindrome: w c w^R
  const markedPalMatch = lowerCompact.match(/^w([c#_])w\^?r$/);
  if (markedPalMatch) {
    const marker = markedPalMatch[1];
    return analyzeLanguage({
      valid: true,
      category: "marked_palindrome",
      centerMarker: marker,
      alphabet: [...detectedAlphabet, marker],
      subAlphabet: detectedAlphabet,
      rawInput: raw,
      formattedName: `L = { w ${marker} wᴿ | w ∈ {${detectedAlphabet.join(",")}}* }`,
      patternDisplay: `w → ${marker} → wᴿ`
    });
  }

  // 3B. Center-Marked Duplicate: w c w
  const markedDupMatch = lowerCompact.match(/^w([c#_])w$/);
  if (markedDupMatch) {
    const marker = markedDupMatch[1];
    return analyzeLanguage({
      valid: true,
      category: "marked_duplicate",
      centerMarker: marker,
      alphabet: [...detectedAlphabet, marker],
      subAlphabet: detectedAlphabet,
      rawInput: raw,
      formattedName: `L = { w ${marker} w | w ∈ {${detectedAlphabet.join(",")}}* }`,
      patternDisplay: `w → ${marker} → w`
    });
  }

  // 3C. Even Palindrome: w w^R
  if (lowerCompact === "ww^r" || lowerCompact === "w w^r" || lowerCompact === "wwr") {
    return analyzeLanguage({
      valid: true,
      category: "even_palindrome",
      alphabet: detectedAlphabet,
      rawInput: raw,
      formattedName: `L = { w wᴿ | w ∈ {${detectedAlphabet.join(",")}}* }`,
      patternDisplay: `w → wᴿ (Even Palindrome)`
    });
  }

  // 3D. Exact Duplicate String: w w
  if (lowerCompact === "ww" || lowerCompact === "w w") {
    return analyzeLanguage({
      valid: true,
      category: "duplicate_string",
      alphabet: detectedAlphabet,
      rawInput: raw,
      formattedName: `L = { w w | w ∈ {${detectedAlphabet.join(",")}}* }`,
      patternDisplay: `w → w (Exact Duplicate String)`
    });
  }

  // --------------------------------------------------------------------------
  // PATTERN TYPE 4: GENERAL BLOCK SEQUENCE (0^m 1^n 0^m, a^n b^n c^n, etc.)
  // --------------------------------------------------------------------------
  // Multi-pass tokenizer: handles both symbol^var and symbol var
  let blocks = [];
  const reCaret = /([a-zA-Z0-9])\^([a-zA-Z0-9]+?)(?=[a-zA-Z0-9]\^|\s|$)/g;
  let bMatch;
  while ((bMatch = reCaret.exec(exprPart)) !== null) {
    blocks.push({
      symbol: bMatch[1],
      variable: bMatch[2]
    });
  }

  // Fallback to spaced blocks if no carets (e.g. 0 m 1 n 0 m)
  if (blocks.length === 0) {
    const reSpace = /([a-zA-Z0-9])\s+([a-zA-Z])(?=\s|$)/g;
    while ((bMatch = reSpace.exec(exprPart)) !== null) {
      blocks.push({
        symbol: bMatch[1],
        variable: bMatch[2]
      });
    }
  }

  if (blocks.length >= 2 || (blocks.length === 1 && blocks[0].variable)) {
    return analyzeLanguage({
      valid: true,
      category: "block_sequence",
      blocks: blocks,
      minVal: defaultMinVal,
      rawInput: raw,
      condPart: condPart
    });
  }

  // --------------------------------------------------------------------------
  // UNSUPPORTED EQUATION HANDLING
  // --------------------------------------------------------------------------
  return {
    valid: false,
    errorTitle: "Language Pattern Not Supported Yet",
    errorDesc: "The simulator currently supports standard regular/non-regular language patterns such as equal-count, repeated-block, reverse and exponent-based patterns."
  };
}

/**
 * Analyzes parsed language AST and builds detailed constraints,
 * alphabet, pattern descriptions, and educational explanations.
 */
function analyzeLanguage(parsed) {
  if (!parsed.valid) return parsed;

  const category = parsed.category;
  const constraints = [];

  if (category === "block_sequence") {
    const blocks = parsed.blocks;
    const alphabetSet = new Set();
    const varUsage = {}; // varName -> array of block indices

    blocks.forEach((b, idx) => {
      alphabetSet.add(b.symbol);
      if (!varUsage[b.variable]) varUsage[b.variable] = [];
      varUsage[b.variable].push(idx);
    });

    parsed.alphabet = Array.from(alphabetSet);
    parsed.varUsage = varUsage;

    // Detect equality constraints and independent variables
    const equalityVars = [];
    const independentVars = [];

    for (let v in varUsage) {
      const indices = varUsage[v];
      if (indices.length > 1) {
        equalityVars.push(v);
        const blockDescs = indices.map(i => `Block ${i + 1} (${blocks[i].symbol})`).join(" and ");
        constraints.push(`Blocks with variable '${v}' must have equal length: ${blockDescs} (${v} = ${v})`);
      } else {
        independentVars.push(v);
        const idx = indices[0];
        constraints.push(`Block ${idx + 1} (${blocks[idx].symbol}) has independent exponent '${v}'`);
      }
    }

    parsed.equalityVars = equalityVars;
    parsed.independentVars = independentVars;

    // Alphabet constraint
    constraints.push(`Alphabet symbols: { ${parsed.alphabet.join(", ")} }`);
    constraints.push(`Lower bound: all exponents ≥ ${parsed.minVal}`);

    // Build visual pattern display: e.g. 0ᵐ → 1ⁿ → 0ᵐ
    parsed.patternDisplay = blocks.map(b => `${b.symbol}${toSuperscript(b.variable)}`).join(" → ");
    parsed.formattedName = `L = { ${blocks.map(b => `${b.symbol}^${b.variable}`).join(" ")} | ${Object.keys(varUsage).join(",")} ≥ ${parsed.minVal} }`;

    parsed.explanation = equalityVars.length > 0
      ? `This language requires matching lengths across separated blocks (${equalityVars.join(", ")}), requiring counting memory beyond finite automata.`
      : `Exponents are independent; the language permits unrestricted concatenation across symbols.`;

  } else if (category === "unary_prime") {
    constraints.push(`Alphabet symbol: { ${parsed.alphabet.join(", ")} }`);
    constraints.push(`Length |w| must be a prime number (≥ 2)`);
    parsed.explanation = `Unary prime languages cannot be recognized by finite automata because prime gaps grow non-linearly.`;

  } else if (category === "unary_square") {
    constraints.push(`Alphabet symbol: { ${parsed.alphabet.join(", ")} }`);
    constraints.push(`Length |w| must be a perfect square (1, 4, 9, 16, ...)`);
    parsed.explanation = `Unary square languages are non-regular because gaps between consecutive squares increase with each term.`;

  } else if (category === "marked_palindrome") {
    constraints.push(`Exactly one central marker symbol '${parsed.centerMarker}'`);
    constraints.push(`Left substring w must equal reversed right substring wᴿ`);
    constraints.push(`Alphabet symbols: { ${parsed.alphabet.join(", ")} }`);
    parsed.explanation = `The central '${parsed.centerMarker}' marks the midpoint; pumping in the first half desynchronizes it from the second half.`;

  } else if (category === "even_palindrome") {
    constraints.push(`String length must be strictly even`);
    constraints.push(`Second half must equal the exact reversal of the first half`);
    constraints.push(`Alphabet symbols: { ${parsed.alphabet.join(", ")} }`);
    parsed.explanation = `Without a center marker, recognizing palindromes requires non-deterministic counting and reversal verification.`;

  } else if (category === "duplicate_string") {
    constraints.push(`String length must be strictly even`);
    constraints.push(`First half must be identical to the second half (w w)`);
    constraints.push(`Alphabet symbols: { ${parsed.alphabet.join(", ")} }`);
    parsed.explanation = `Exact duplication requires matching symbols across the boundary without stack-reversal, placing it outside regular languages.`;

  } else if (category === "marked_duplicate") {
    constraints.push(`Central separator '${parsed.centerMarker}'`);
    constraints.push(`Left substring w equals right substring w`);
    constraints.push(`Alphabet symbols: { ${parsed.alphabet.join(", ")} }`);
    parsed.explanation = `Matching duplicate halves across a separator requires unbounded memory.`;
  }

  parsed.constraints = constraints;
  return parsed;
}

// ----------------------------------------------------------------------------
// 3. WITNESS GENERATOR
// ----------------------------------------------------------------------------

/**
 * Dynamically generates a canonical witness string w satisfying |w| >= p
 * for any recognized formal language.
 */
function generateWitness(parsed, p) {
  if (!parsed || !parsed.valid) return "";

  const category = parsed.category;

  if (category === "block_sequence") {
    // Generate each block with count p (guaranteeing >= p and non-zero)
    return parsed.blocks.map(b => b.symbol.repeat(p)).join("");

  } else if (category === "unary_prime") {
    let m = Math.max(2, p);
    while (!isPrimeNumber(m)) m++;
    return parsed.symbol.repeat(m);

  } else if (category === "unary_square") {
    const i = Math.max(1, Math.ceil(Math.sqrt(p)));
    return parsed.symbol.repeat(i * i);

  } else if (category === "marked_palindrome") {
    // Prefix u = a^p b, separator c, reversal u^R = b a^p
    const a = parsed.subAlphabet[0];
    const b = parsed.subAlphabet[1] || a;
    const c = parsed.centerMarker;
    return a.repeat(p) + b + c + b + a.repeat(p);

  } else if (category === "even_palindrome") {
    // Half u = a^p b, reversal u^R = b a^p
    const a = parsed.alphabet[0];
    const b = parsed.alphabet[1] || a;
    return a.repeat(p) + b + b + a.repeat(p);

  } else if (category === "duplicate_string") {
    // Half u = 0^p 1^p, duplicate u = 0^p 1^p
    const a = parsed.alphabet[0];
    const b = parsed.alphabet[1] || a;
    const half = a.repeat(p) + b.repeat(p);
    return half + half;

  } else if (category === "marked_duplicate") {
    const a = parsed.subAlphabet[0];
    const b = parsed.subAlphabet[1] || a;
    const c = parsed.centerMarker;
    const half = a.repeat(p) + b;
    return half + c + half;
  }

  return "";
}

// ----------------------------------------------------------------------------
// 4. DECOMPOSITION GENERATOR (|xy| <= p, |y| > 0)
// ----------------------------------------------------------------------------

function generateValidSplits(parsed, witness, p) {
  const splits = [];

  for (let xLen = 0; xLen < p; xLen++) {
    for (let yLen = 1; xLen + yLen <= p; yLen++) {
      const x = witness.substring(0, xLen);
      const y = witness.substring(xLen, xLen + yLen);
      const z = witness.substring(xLen + yLen);

      splits.push({
        x: x,
        y: y,
        z: z,
        xyLen: xLen + yLen,
        yLen: yLen,
        zLen: z.length
      });
    }
  }

  return splits;
}

function pumpString(x, y, z, i) {
  return x + y.repeat(i) + z;
}

// ----------------------------------------------------------------------------
// 5. DYNAMIC MEMBERSHIP CHECKER (isInLanguage)
// ----------------------------------------------------------------------------

/**
 * Evaluates whether a given string belongs to the parsed language definition.
 * Evaluates exact block constraints, duplicate halves, palindromes, or unary prime/square.
 */
function isInLanguage(parsed, str) {
  if (!parsed || !parsed.valid) {
    return { inLang: false, reason: "Invalid or unsupported language definition." };
  }

  // 1. Alphabet check
  const allowed = new Set(parsed.alphabet);
  for (let ch of str) {
    if (!allowed.has(ch)) {
      return {
        inLang: false,
        reason: `Unexpected character '${ch}'. Language alphabet allows only { ${parsed.alphabet.join(", ")} }.`
      };
    }
  }

  const category = parsed.category;

  // --------------------------------------------------------------------------
  // BLOCK SEQUENCE EVALUATION
  // --------------------------------------------------------------------------
  if (category === "block_sequence") {
    const blocks = parsed.blocks;
    const minVal = parsed.minVal;

    // If string is empty
    if (str === "") {
      if (minVal === 0) {
        return { inLang: true, reason: "Empty string is in language (all exponents allowed to be 0)." };
      }
      return { inLang: false, reason: "Empty string is not in language (exponents require ≥ 1)." };
    }

    // Partition string into blocks using regex
    const regexPattern = "^" + blocks.map(b => `(${escapeRegex(b.symbol)}${minVal > 0 ? "+" : "*"})`).join("") + "$";
    let match = str.match(new RegExp(regexPattern));

    if (!match) {
      return {
        inLang: false,
        reason: `String does not follow the required block sequence: ${blocks.map(b => b.symbol).join(" → ")}.`
      };
    }

    const blockLengths = match.slice(1).map(s => s.length);

    // Verify minimum length on each block
    for (let i = 0; i < blocks.length; i++) {
      if (blockLengths[i] < minVal) {
        return {
          inLang: false,
          reason: `Block ${i + 1} (${blocks[i].symbol}) has length ${blockLengths[i]}, violating lower bound condition (requires ≥ ${minVal}).`
        };
      }
    }

    // Verify equality constraints between blocks with the same variable
    const varLengths = {};
    for (let i = 0; i < blocks.length; i++) {
      const v = blocks[i].variable;
      const len = blockLengths[i];
      if (varLengths[v] === undefined) {
        varLengths[v] = { len: len, blockIndex: i };
      } else {
        if (varLengths[v].len !== len) {
          const firstIdx = varLengths[v].blockIndex;
          return {
            inLang: false,
            reason: `Equality constraint broken for variable '${v}': Block ${firstIdx + 1} (${blocks[firstIdx].symbol}) has length ${varLengths[v].len}, but Block ${i + 1} (${blocks[i].symbol}) has length ${len} (expected equal length ${v} = ${v}).`
          };
        }
      }
    }

    const countsSummary = blocks.map((b, idx) => `${blockLengths[idx]} ${b.symbol}'s`).join(", ");
    return {
      inLang: true,
      reason: `Satisfies all block constraints (${countsSummary}).`
    };

  // --------------------------------------------------------------------------
  // UNARY PRIME EVALUATION
  // --------------------------------------------------------------------------
  } else if (category === "unary_prime") {
    if (str === "") {
      return { inLang: false, reason: "Empty string length (0) is not prime (primes are integers ≥ 2)." };
    }
    const len = str.length;
    if (!isPrimeNumber(len)) {
      const div = findFirstDivisor(len);
      return {
        inLang: false,
        reason: `Length |w| = ${len} is composite (divisible by ${div}, not a prime number).`
      };
    }
    return {
      inLang: true,
      reason: `Length |w| = ${len} is a valid prime number.`
    };

  // --------------------------------------------------------------------------
  // UNARY SQUARE EVALUATION
  // --------------------------------------------------------------------------
  } else if (category === "unary_square") {
    if (str === "") {
      return { inLang: false, reason: "Empty string length is 0 (requires index i ≥ 1)." };
    }
    const len = str.length;
    if (!isPerfectSquare(len)) {
      const lower = Math.floor(Math.sqrt(len)) ** 2;
      const upper = Math.ceil(Math.sqrt(len)) ** 2;
      return {
        inLang: false,
        reason: `Length |w| = ${len} is not a perfect square (lies strictly between ${lower} and ${upper}).`
      };
    }
    const root = Math.round(Math.sqrt(len));
    return {
      inLang: true,
      reason: `Length |w| = ${len} = ${root}² is a valid perfect square.`
    };

  // --------------------------------------------------------------------------
  // MARKED PALINDROME EVALUATION
  // --------------------------------------------------------------------------
  } else if (category === "marked_palindrome") {
    const parts = str.split(parsed.centerMarker);
    if (parts.length !== 2) {
      return {
        inLang: false,
        reason: `String must contain exactly one central marker '${parsed.centerMarker}' (found ${parts.length - 1} occurrences).`
      };
    }
    const left = parts[0];
    const right = parts[1];
    if (left !== reverseString(right)) {
      return {
        inLang: false,
        reason: `Symmetry broken: left side "${left}" does not match reversed right side "${reverseString(right)}".`
      };
    }
    return {
      inLang: true,
      reason: `Exact palindrome symmetry across center marker '${parsed.centerMarker}': "${left}" ${parsed.centerMarker} "${right}".`
    };

  // --------------------------------------------------------------------------
  // EVEN PALINDROME EVALUATION
  // --------------------------------------------------------------------------
  } else if (category === "even_palindrome") {
    if (str.length % 2 !== 0) {
      return {
        inLang: false,
        reason: `String length (${str.length}) is odd. Form w wᴿ requires strictly even length.`
      };
    }
    const half = str.length / 2;
    const left = str.substring(0, half);
    const right = str.substring(half);
    if (left !== reverseString(right)) {
      return {
        inLang: false,
        reason: `Second half "${right}" does not match the reversal of first half "${reverseString(left)}".`
      };
    }
    return {
      inLang: true,
      reason: `Even palindrome: length ${str.length}, first half equals reversed second half.`
    };

  // --------------------------------------------------------------------------
  // EXACT DUPLICATE STRING EVALUATION (ww)
  // --------------------------------------------------------------------------
  } else if (category === "duplicate_string") {
    if (str.length % 2 !== 0) {
      return {
        inLang: false,
        reason: `String length (${str.length}) is odd. Form w w requires strictly even length.`
      };
    }
    const half = str.length / 2;
    const left = str.substring(0, half);
    const right = str.substring(half);
    if (left !== right) {
      return {
        inLang: false,
        reason: `First half "${left}" does not equal second half "${right}" (expected identical halves w w).`
      };
    }
    return {
      inLang: true,
      reason: `Exact duplicate string: "${left}" concatenated with "${right}".`
    };

  // --------------------------------------------------------------------------
  // MARKED DUPLICATE STRING EVALUATION (wcw)
  // --------------------------------------------------------------------------
  } else if (category === "marked_duplicate") {
    const parts = str.split(parsed.centerMarker);
    if (parts.length !== 2) {
      return {
        inLang: false,
        reason: `String must contain exactly one separator '${parsed.centerMarker}'.`
      };
    }
    if (parts[0] !== parts[1]) {
      return {
        inLang: false,
        reason: `Left side "${parts[0]}" does not equal right side "${parts[1]}".`
      };
    }
    return {
      inLang: true,
      reason: `Exact duplicate halves separated by '${parsed.centerMarker}'.`
    };
  }

  return { inLang: false, reason: "Condition checking not implemented for this pattern." };
}

function getLanguageExplanation(parsed) {
  return parsed ? parsed.explanation : "";
}

// ----------------------------------------------------------------------------
// 6. MACHINE ADVERSARY SPLIT FINDER
// ----------------------------------------------------------------------------

function findAdversarialSplit(parsed, splits) {
  let bestIdx = 0;
  let bestScore = -1;
  let targetI = 0;

  for (let idx = 0; idx < splits.length; idx++) {
    const sp = splits[idx];

    // Systematically test exponent values i = 0, 2, 3
    for (let testI of [0, 2, 3]) {
      const pumped = pumpString(sp.x, sp.y, sp.z, testI);
      const check = isInLanguage(parsed, pumped);
      if (!check.inLang) {
        // Prioritize splits with clean Y and testI = 0
        const score = 100 + (testI === 0 ? 25 : 0) + sp.yLen;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
          targetI = testI;
        }
        break;
      }
    }
  }

  return {
    splitIndex: bestIdx,
    targetI: targetI
  };
}

// ----------------------------------------------------------------------------
// 7. EXPERIMENT STATE
// ----------------------------------------------------------------------------

const simState = {
  currentStep: 0,
  activeMode: "custom", // "custom" or "predefined"
  parsedLang: null,
  w: "000111000",
  p: 3,
  witnessMode: "auto", // "auto" or "custom"
  splits: [],
  selectedSplit: null,
  selectedSplitIndex: 0,
  isAdversarialChosen: false,
  currentI: 0,
  pumpedString: "0111000",
  isPumpedInLang: false,
  checkReason: ""
};

// ----------------------------------------------------------------------------
// 8. STEPPER & SCREEN TRANSITIONS
// ----------------------------------------------------------------------------

function goToStep(stepNum) {
  simState.currentStep = stepNum;

  const screenIds = [
    "welcomeScreen", // 0
    "step1Screen",    // 1
    "step2Screen",    // 2
    "step3Screen",    // 3
    "step4Screen",    // 4
    "step5Screen"     // 5
  ];

  screenIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (idx === stepNum) {
      el.classList.add("active-screen");
    } else {
      el.classList.remove("active-screen");
    }
  });

  // Stepper Bar
  for (let s = 1; s <= 5; s++) {
    const stepEl = document.getElementById(`progStep${s}`);
    if (!stepEl) continue;

    stepEl.classList.remove("active", "completed");
    if (s === stepNum) {
      stepEl.classList.add("active");
    } else if (s < stepNum) {
      stepEl.classList.add("completed");
    }

    if (s < 5) {
      const lineEl = document.getElementById(`line${s}_${s + 1}`);
      if (lineEl) {
        if (s < stepNum) {
          lineEl.classList.add("completed");
        } else {
          lineEl.classList.remove("completed");
        }
      }
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetExperiment() {
  simState.splits = [];
  simState.selectedSplit = null;
  simState.selectedSplitIndex = 0;
  simState.isAdversarialChosen = false;
  simState.currentI = 0;
  simState.pumpedString = "";
  simState.isPumpedInLang = false;
  simState.checkReason = "";
  hideStep1Error();
  updateWitnessPreview();
}

// ----------------------------------------------------------------------------
// 9. STEP 1: VALIDATION & FORM LOGIC
// ----------------------------------------------------------------------------

function validatePumpingLength(pVal) {
  if (pVal === "" || pVal === null || pVal === undefined) {
    return {
      isValid: false,
      title: "Please enter a valid positive integer pumping length.",
      desc: "Pumping length p cannot be empty."
    };
  }

  const pNum = Number(pVal);
  if (isNaN(pNum)) {
    return {
      isValid: false,
      title: "Please enter a valid positive integer pumping length.",
      desc: "Pumping length p must be a numeric value."
    };
  }

  if (pNum <= 0) {
    return {
      isValid: false,
      title: "Please enter a valid positive integer pumping length.",
      desc: `The Pumping Lemma requires a positive integer p > 0. Received p = ${pNum}. Rejecting negative numbers and zero.`
    };
  }

  if (!Number.isInteger(pNum)) {
    return {
      isValid: false,
      title: "Please enter a valid positive integer pumping length.",
      desc: `Pumping length p must be a whole integer, decimal values (${pNum}) are rejected.`
    };
  }

  return { isValid: true, p: pNum };
}

function showStep1Error(title, desc) {
  const errBox = document.getElementById("step1Error");
  document.getElementById("step1ErrorTitle").textContent = title;
  document.getElementById("step1ErrorDesc").textContent = desc;
  errBox.classList.remove("hidden");
}

function hideStep1Error() {
  document.getElementById("step1Error").classList.add("hidden");
}

function updateWitnessPreview() {
  const pVal = document.getElementById("inputP").value;
  const pCheck = validatePumpingLength(pVal);
  const p = pCheck.isValid ? pCheck.p : 3;

  if (!simState.parsedLang || !simState.parsedLang.valid) return;

  const sampleW = generateWitness(simState.parsedLang, p);
  const previewText = `For p = ${p}: w = ${sampleW} (|w| = ${sampleW.length} ≥ p ✓)`;
  document.getElementById("wpFormulaText").textContent = previewText;
}

function runAnalysisOnCurrentInput() {
  const rawInput = document.getElementById("customLangInput").value;
  const parsed = parseLanguage(rawInput);

  const detectedCard = document.getElementById("detectedLangCard");
  const unsupportedBanner = document.getElementById("unsupportedLangBanner");

  if (parsed.valid) {
    simState.parsedLang = parsed;
    detectedCard.classList.remove("hidden");
    unsupportedBanner.classList.add("hidden");

    document.getElementById("detectedTypeTag").textContent = parsed.category.replace(/_/g, " ");
    document.getElementById("detectedPatternVal").textContent = parsed.patternDisplay;

    const listEl = document.getElementById("detectedConstraintsList");
    listEl.innerHTML = "";
    parsed.constraints.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      listEl.appendChild(li);
    });

    updateWitnessPreview();
    hideStep1Error();
  } else {
    simState.parsedLang = null;
    detectedCard.classList.add("hidden");
    unsupportedBanner.classList.remove("hidden");
  }
}

// ----------------------------------------------------------------------------
// 10. STEP 2: STRING ANALYSIS & WITNESS DISPLAY
// ----------------------------------------------------------------------------

function setupStep2View() {
  const parsed = simState.parsedLang;
  const w = simState.w;
  const p = simState.p;

  document.getElementById("step2LangDisplay").textContent = parsed.formattedName;
  document.getElementById("step2PLen").textContent = `p = ${p}`;
  document.getElementById("step2StrValue").textContent = `w = ${w}`;

  document.getElementById("step2Formula").textContent = parsed.patternDisplay;
  document.getElementById("step2CheckDetail").textContent = `Length |w| = ${w.length} ≥ p (${parsed.category.replace(/_/g, " ")} verified ✓)`;

  document.getElementById("step2StrLen").textContent = `|w| = ${w.length}`;
  document.getElementById("step2PLenMetric").textContent = `p = ${p}`;
  document.getElementById("step2BoundCheck").textContent = `|w| = ${w.length} ≥ ${p} ✓`;

  const tape = document.getElementById("step2Tape");
  tape.innerHTML = "";

  for (let i = 0; i < w.length; i++) {
    const char = w[i];
    const charBox = document.createElement("div");
    charBox.className = "tape-char";
    charBox.innerHTML = `<span>${char}</span><span class="char-index">${i + 1}</span>`;
    tape.appendChild(charBox);
  }
}

// ----------------------------------------------------------------------------
// 11. STEP 3: DECOMPOSITION SEARCH
// ----------------------------------------------------------------------------

function renderSplitsGrid() {
  const container = document.getElementById("splitsCardsGrid");
  container.innerHTML = "";

  simState.splits.forEach((split, idx) => {
    const card = document.createElement("div");
    card.className = "split-card-item";
    if (idx === simState.selectedSplitIndex) {
      card.classList.add("selected");
    }

    const xDisp = split.x === "" ? "ε" : split.x;
    const yDisp = split.y;
    const zDisp = split.z === "" ? "ε" : split.z;

    card.innerHTML = `
      <div class="split-header-tag">
        <span>Split #${idx + 1}</span>
        <span>|xy| = ${split.xyLen} ≤ ${simState.p} ✓</span>
      </div>
      <div class="split-visual-preview">
        <span class="comp-x">[ ${xDisp} ]</span>
        <span class="comp-y">[ ${yDisp} ]</span>
        <span class="comp-z">[ ${zDisp} ]</span>
      </div>
      <div class="split-meta-text">
        X = "${xDisp}", Y = "${yDisp}", Z = "${zDisp}" (|y| = ${split.yLen} &gt; 0 ✓)
      </div>
    `;

    card.addEventListener("click", () => {
      selectSplitAndProceed(idx, false, 0);
    });

    container.appendChild(card);
  });
}

function selectSplitAndProceed(index, isAdversarial, targetI) {
  simState.selectedSplitIndex = index;
  simState.selectedSplit = simState.splits[index];
  simState.isAdversarialChosen = isAdversarial;
  simState.currentI = targetI !== undefined ? targetI : 0;

  setupStep4View();
  goToStep(4);
}

// ----------------------------------------------------------------------------
// 12. STEP 4: VISUAL STRING PARTITION & PUMPING ANIMATION
// ----------------------------------------------------------------------------

function setupStep4View() {
  const split = simState.selectedSplit;
  const parsed = simState.parsedLang;
  const advBanner = document.getElementById("advSuccessBanner");

  if (simState.isAdversarialChosen) {
    document.getElementById("advYText").textContent = `"${split.y}"`;
    document.getElementById("advBannerDesc").textContent =
      `The machine adversary selected split X="${split.x || 'ε'}", Y="${split.y}", Z="${split.z || 'ε'}" where pumping Y breaks ${parsed.formattedName}.`;
    advBanner.classList.remove("hidden");
  } else {
    advBanner.classList.add("hidden");
  }

  // Visual blocks
  const blocksContainer = document.getElementById("visualBlocksContainer");
  blocksContainer.innerHTML = "";

  function createGroup(text, partClass, labelText, labelClass) {
    const grp = document.createElement("div");
    grp.className = "partition-group";

    const box = document.createElement("div");
    box.className = `partition-box ${partClass}`;
    box.textContent = text === "" ? "ε" : text;

    const lbl = document.createElement("span");
    lbl.className = `group-label ${labelClass}`;
    lbl.textContent = labelText;

    grp.appendChild(box);
    grp.appendChild(lbl);
    return grp;
  }

  blocksContainer.appendChild(createGroup(split.x, "box-x", "X", "label-x"));
  blocksContainer.appendChild(createGroup(split.y, "box-y", "Y", "label-y"));
  blocksContainer.appendChild(createGroup(split.z, "box-z", "Z", "label-z"));

  document.getElementById("lblPartX").textContent = split.x === "" ? "ε" : split.x;
  document.getElementById("lblPartY").textContent = split.y;
  document.getElementById("lblPartZ").textContent = split.z === "" ? "ε" : split.z;

  applyPump(simState.currentI);
}

function applyPump(i) {
  simState.currentI = i;
  const split = simState.selectedSplit;
  const parsed = simState.parsedLang;

  document.querySelectorAll(".btn-i-num").forEach(btn => {
    const btnI = parseInt(btn.getAttribute("data-i"), 10);
    if (btnI === i) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  let formulaText = "";
  if (i === 0) formulaText = `x + (y)⁰ + z  →  x + z  (Y removed / pumped down)`;
  else if (i === 1) formulaText = `x + (y)¹ + z  →  x + y + z  (Original witness string)`;
  else if (i === 2) formulaText = `x + (y)² + z  →  x + y + y + z  (Y duplicated / pumped up)`;
  else formulaText = `x + (y)³ + z  →  x + y + y + y + z  (Y repeated 3 times)`;

  document.getElementById("transformFormula").textContent = formulaText;

  const flowContainer = document.getElementById("pumpedChipsFlow");
  flowContainer.innerHTML = "";

  function addChip(text, className) {
    if (text === "") return;
    const chip = document.createElement("span");
    chip.className = `pump-token-chip ${className}`;
    chip.textContent = text;
    flowContainer.appendChild(chip);
  }

  addChip(split.x, "box-x");
  for (let k = 0; k < i; k++) {
    addChip(split.y, "box-y");
  }
  addChip(split.z, "box-z");

  const pumpedStr = pumpString(split.x, split.y, split.z, i);
  simState.pumpedString = pumpedStr;

  if (pumpedStr === "") {
    const emptyChip = document.createElement("span");
    emptyChip.className = "pump-token-chip";
    emptyChip.textContent = "ε (empty string)";
    flowContainer.appendChild(emptyChip);
  }

  document.getElementById("pumpedStringVal").textContent = pumpedStr === "" ? "ε" : pumpedStr;

  // Live Membership Evaluation
  const check = isInLanguage(parsed, pumpedStr);
  simState.isPumpedInLang = check.inLang;
  simState.checkReason = check.reason;

  const liveBox = document.getElementById("liveCheckBox");
  const liveIcon = document.getElementById("liveCheckIcon");
  const liveTitle = document.getElementById("liveCheckTitle");
  const liveTag = document.getElementById("liveCheckTag");
  const liveReason = document.getElementById("liveCheckReason");

  const displayPumped = pumpedStr === "" ? "ε" : pumpedStr;

  if (!check.inLang) {
    liveBox.className = "live-check-box status-violation";
    liveIcon.textContent = "✗";
    liveTitle.textContent = `${displayPumped} ∉ L`;
    liveTag.textContent = "Does NOT belong to L (Violation Found)";
    liveReason.textContent = check.reason || "The pumped string violates the language condition.";
  } else {
    liveBox.className = "live-check-box status-safe";
    liveIcon.textContent = "✓";
    liveTitle.textContent = `${displayPumped} ∈ L`;
    liveTag.textContent = "Belongs to L";
    liveReason.textContent = `${check.reason} (Try selecting i = 0 or i = 2 to see the violation!)`;
  }
}

// ----------------------------------------------------------------------------
// 13. STEP 5: FINAL RESULT / CONCLUSION
// ----------------------------------------------------------------------------

function setupStep5View() {
  const split = simState.selectedSplit;
  const parsed = simState.parsedLang;

  document.getElementById("finalSpecLang").textContent = parsed.formattedName;
  document.getElementById("finalSpecW").textContent = simState.w;
  document.getElementById("finalSpecSplit").textContent = `x = "${split.x || 'ε'}", y = "${split.y}", z = "${split.z || 'ε'}"`;
  document.getElementById("finalSpecI").textContent = `i = ${simState.currentI}`;
  document.getElementById("finalSpecPumped").textContent = simState.pumpedString === "" ? "ε" : simState.pumpedString;

  const finalBanner = document.getElementById("finalBanner");
  const bannerIcon = document.getElementById("finalBannerIcon");
  const bannerTitle = document.getElementById("finalBannerTitle");
  const bannerDesc = document.getElementById("finalBannerDesc");
  const specCheck = document.getElementById("finalSpecCheck");
  const theoryNoteText = document.getElementById("theoryNoteText");

  const displayPumped = simState.pumpedString === "" ? "ε" : simState.pumpedString;

  if (!simState.isPumpedInLang) {
    finalBanner.className = "final-banner banner-violation";
    bannerIcon.textContent = "❌";
    bannerTitle.textContent = "✓ COUNTEREXAMPLE FOUND";
    bannerDesc.textContent = `The pumped string does not satisfy: ${parsed.formattedName}. Therefore: xy^${simState.currentI}z ∉ L for the selected pumping value. Reason: ${simState.checkReason}`;
    specCheck.className = "spec-v text-danger";
    specCheck.textContent = `${displayPumped} ∉ L (Violation)`;
    theoryNoteText.textContent = `The simulator demonstrated that for language ${parsed.formattedName}, decomposing w = xyz with |xy| ≤ ${simState.p} and |y| > 0 allows pumping exponent i = ${simState.currentI} to generate "${displayPumped}", which falls strictly outside the language. If L were regular, every valid decomposition would have to remain in L for ALL non-negative integers i. This counterexample demonstrates why the language fails the Pumping Lemma.`;
  } else {
    finalBanner.className = "final-banner banner-safe";
    bannerIcon.textContent = "✔️";
    bannerTitle.textContent = `String in Language (No Violation for i = ${simState.currentI})`;
    bannerDesc.textContent = `Pumping with this particular exponent produced a string that remains in ${parsed.formattedName}. To demonstrate non-regularity, try selecting exponent i = 0 or i = 2.`;
    specCheck.className = "spec-v text-success";
    specCheck.textContent = `${displayPumped} ∈ L (In Language)`;
    theoryNoteText.textContent = `For exponent i = ${simState.currentI}, the string happened to maintain language membership. However, a regular language must satisfy the condition for EVERY exponent i ≥ 0. Testing i = 0 (pumping down) or i = 2 (pumping up) will produce the necessary contradiction.`;
  }
}

// ----------------------------------------------------------------------------
// 14. MANUAL SPLIT VALIDATION
// ----------------------------------------------------------------------------

let manualSplitCandidate = null;

function validateManualSplit() {
  const x = document.getElementById("manualX").value;
  const y = document.getElementById("manualY").value;
  const z = document.getElementById("manualZ").value;

  const feedback = document.getElementById("manualFeedback");
  const fbIcon = document.getElementById("manualFeedbackIcon");
  const fbText = document.getElementById("manualFeedbackText");
  const useBtn = document.getElementById("btnUseManualSplit");

  feedback.classList.remove("hidden");

  // Condition 1: w = xyz
  if (x + y + z !== simState.w) {
    feedback.className = "alert-box alert-danger";
    fbIcon.textContent = "✗";
    fbText.innerHTML = `<strong>Invalid decomposition:</strong> x + y + z ("${x + y + z}") does not equal original witness string w ("${simState.w}").`;
    useBtn.classList.add("hidden");
    manualSplitCandidate = null;
    return;
  }

  // Condition 2: |xy| <= p
  if (x.length + y.length > simState.p) {
    feedback.className = "alert-box alert-danger";
    fbIcon.textContent = "✗";
    fbText.innerHTML = `<strong>Invalid decomposition:</strong> |xy| = ${x.length + y.length}, which exceeds pumping length p = ${simState.p}. Condition requires |xy| ≤ p.`;
    useBtn.classList.add("hidden");
    manualSplitCandidate = null;
    return;
  }

  // Condition 3: |y| > 0
  if (y.length === 0) {
    feedback.className = "alert-box alert-danger";
    fbIcon.textContent = "✗";
    fbText.innerHTML = `<strong>Invalid decomposition:</strong> |y| must be greater than 0 (y cannot be empty).`;
    useBtn.classList.add("hidden");
    manualSplitCandidate = null;
    return;
  }

  feedback.className = "alert-box alert-success";
  fbIcon.textContent = "✓";
  fbText.innerHTML = `<strong>Valid decomposition!</strong> Satisfies w = xyz, |xy| = ${x.length + y.length} ≤ ${simState.p} ✓, and |y| = ${y.length} &gt; 0 ✓.`;
  useBtn.classList.remove("hidden");

  manualSplitCandidate = {
    x: x,
    y: y,
    z: z,
    xyLen: x.length + y.length,
    yLen: y.length,
    zLen: z.length
  };
}

// ----------------------------------------------------------------------------
// 15. PRESET EXAMPLES & UI HANDLERS
// ----------------------------------------------------------------------------

const PREDEFINED_EQUATIONS = {
  "0m_1n_0m": "L = {0^m 1^n 0^m | m,n >= 0}",
  "an_bn": "L = {a^n b^n | n >= 1}",
  "an_bn_cn": "L = {a^n b^n c^n | n >= 1}",
  "0n_1n": "L = {0^n 1^n | n >= 0}",
  "ww": "L = {ww | w in {0,1}*}",
  "wcw_r": "L = {wcw^R | w in {a,b}*}",
  "ww_r": "L = {ww^R | w in {a,b}*}",
  "prime": "L = {a^p | p is prime}",
  "square": "L = {a^(i^2) | i >= 1}"
};

function loadPresetExample(caseNum) {
  resetExperiment();

  if (caseNum === 1) {
    // Case 1: L = 0^m 1^n 0^m, p = 3
    setMode("custom");
    document.getElementById("customLangInput").value = "L = {0^m 1^n 0^m | m,n >= 0}";
    runAnalysisOnCurrentInput();
    document.getElementById("inputP").value = 3;
    setWitnessMode("auto");
    hideStep1Error();
    updateWitnessPreview();
    goToStep(1);
  } else if (caseNum === 2) {
    // Case 2: a^n b^n c^n, p = 3
    setMode("custom");
    document.getElementById("customLangInput").value = "L = {a^n b^n c^n | n >= 1}";
    runAnalysisOnCurrentInput();
    document.getElementById("inputP").value = 3;
    setWitnessMode("auto");
    hideStep1Error();
    updateWitnessPreview();
    goToStep(1);
  } else if (caseNum === 3) {
    // Case 3: ww, p = 3
    setMode("custom");
    document.getElementById("customLangInput").value = "L = {ww | w in {0,1}*}";
    runAnalysisOnCurrentInput();
    document.getElementById("inputP").value = 3;
    setWitnessMode("auto");
    hideStep1Error();
    updateWitnessPreview();
    goToStep(1);
  } else if (caseNum === 4) {
    // Case 4: Invalid p = 0
    setMode("custom");
    document.getElementById("customLangInput").value = "L = {0^m 1^n 0^m | m,n >= 0}";
    runAnalysisOnCurrentInput();
    document.getElementById("inputP").value = 0;
    setWitnessMode("auto");
    goToStep(1);
    showStep1Error(
      "Please enter a valid positive integer pumping length.",
      "The Pumping Lemma requires a positive integer p > 0. Received p = 0."
    );
  }
}

function setMode(mode) {
  simState.activeMode = mode;
  const btnCustom = document.getElementById("btnModeCustom");
  const btnPredef = document.getElementById("btnModePredefined");
  const customSection = document.getElementById("customLangSection");
  const predefGrid = document.getElementById("langCardsGrid");

  if (mode === "custom") {
    btnCustom.classList.add("active");
    btnPredef.classList.remove("active");
    customSection.classList.remove("hidden");
    predefGrid.classList.add("hidden");
    runAnalysisOnCurrentInput();
  } else {
    btnPredef.classList.add("active");
    btnCustom.classList.remove("active");
    predefGrid.classList.remove("hidden");
    customSection.classList.add("hidden");
  }
}

function setWitnessMode(mode) {
  simState.witnessMode = mode;

  const lblAuto = document.getElementById("lblModeAuto");
  const lblCustom = document.getElementById("lblModeCustom");
  const customContainer = document.getElementById("customWitnessContainer");
  const previewBanner = document.getElementById("witnessPreviewBanner");
  const modeHint = document.getElementById("witnessModeHint");

  if (mode === "auto") {
    lblAuto.classList.add("active");
    lblCustom.classList.remove("active");
    lblAuto.querySelector("input").checked = true;
    customContainer.classList.add("hidden");
    previewBanner.classList.remove("hidden");
    modeHint.textContent = "Simulator dynamically generates a canonical witness satisfying |w| ≥ p.";
  } else {
    lblCustom.classList.add("active");
    lblAuto.classList.remove("active");
    lblCustom.querySelector("input").checked = true;
    customContainer.classList.remove("hidden");
    previewBanner.classList.add("hidden");
    modeHint.textContent = "Enter your custom string w to test decomposition and pumping.";

    const inputW = document.getElementById("inputW");
    if (!inputW.value || inputW.value.trim() === "") {
      const pVal = parseInt(document.getElementById("inputP").value, 10) || 3;
      inputW.value = generateWitness(simState.parsedLang, pVal);
    }
  }
}

// ----------------------------------------------------------------------------
// 16. EVENT LISTENERS INITIALIZATION
// ----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  // Welcome Screen actions
  document.getElementById("btnStartSimulation").addEventListener("click", () => {
    goToStep(1);
  });

  const btnOpenExamples = document.getElementById("btnOpenExamples");
  const exampleDrawer = document.getElementById("exampleDrawer");
  btnOpenExamples.addEventListener("click", () => {
    exampleDrawer.classList.toggle("hidden");
  });

  document.querySelectorAll(".example-card-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const exNum = parseInt(e.currentTarget.getAttribute("data-ex"), 10);
      loadPresetExample(exNum);
    });
  });

  // Mode Switcher: Custom vs Predefined
  document.getElementById("btnModeCustom").addEventListener("click", () => {
    setMode("custom");
  });

  document.getElementById("btnModePredefined").addEventListener("click", () => {
    setMode("predefined");
  });

  // Analyze Custom Language Button & Input
  document.getElementById("btnAnalyzeCustomLang").addEventListener("click", () => {
    runAnalysisOnCurrentInput();
  });

  document.getElementById("customLangInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runAnalysisOnCurrentInput();
    }
  });

  // Quick Pattern Chips
  document.querySelectorAll(".quick-ex-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const eq = chip.getAttribute("data-eq");
      document.getElementById("customLangInput").value = eq;
      runAnalysisOnCurrentInput();
    });
  });

  // Predefined Language Cards Selection
  document.querySelectorAll(".lang-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-lang-key");
      document.querySelectorAll(".lang-card").forEach(c => {
        c.classList.remove("active");
        const btn = c.querySelector(".btn-card-select");
        if (btn) btn.textContent = "Select";
      });
      card.classList.add("active");
      const b = card.querySelector(".btn-card-select");
      if (b) b.textContent = "Selected ✓";

      const eq = PREDEFINED_EQUATIONS[key] || "L = {a^n b^n | n >= 1}";
      document.getElementById("customLangInput").value = eq;
      simState.parsedLang = parseLanguage(eq);
      updateWitnessPreview();
      hideStep1Error();
    });
  });

  // Witness Mode Toggle
  document.querySelectorAll("input[name='witnessMode']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      setWitnessMode(e.target.value);
    });
  });

  // Pumping Length Input Change
  document.getElementById("inputP").addEventListener("input", () => {
    updateWitnessPreview();
    hideStep1Error();
  });

  // Step 1: Back to Welcome
  document.getElementById("btnBackToWelcome").addEventListener("click", () => {
    goToStep(0);
  });

  // Step 1 -> Start Experiment
  document.getElementById("btnStartExperiment").addEventListener("click", () => {
    if (simState.activeMode === "custom") {
      runAnalysisOnCurrentInput();
    }

    if (!simState.parsedLang || !simState.parsedLang.valid) {
      showStep1Error(
        "Language Pattern Not Supported Yet",
        "The simulator currently supports standard regular/non-regular language patterns such as equal-count, repeated-block, reverse and exponent-based patterns. Please verify your equation."
      );
      return;
    }

    const pVal = document.getElementById("inputP").value;
    const pCheck = validatePumpingLength(pVal);
    if (!pCheck.isValid) {
      showStep1Error(pCheck.title, pCheck.desc);
      return;
    }
    const p = pCheck.p;

    let w = "";
    if (simState.witnessMode === "auto") {
      w = generateWitness(simState.parsedLang, p);
    } else {
      const customWVal = document.getElementById("inputW").value;
      if (!customWVal || customWVal.trim() === "") {
        showStep1Error("Empty witness string.", "Please enter a witness string for the selected language.");
        return;
      }
      w = customWVal.trim();

      // Check alphabet
      for (let ch of w) {
        if (!simState.parsedLang.alphabet.includes(ch)) {
          showStep1Error(
            "Invalid witness for the selected language.",
            `Character '${ch}' is not permitted. Language allows only alphabet { ${simState.parsedLang.alphabet.join(", ")} }.`
          );
          return;
        }
      }

      // Check length bound |w| >= p
      if (w.length < p) {
        showStep1Error(
          "String length is less than pumping length p.",
          `String length (|w| = ${w.length}) is smaller than p (${p}). The Pumping Lemma applies to strings where |w| ≥ p.`
        );
        return;
      }

      // Check membership
      const membership = isInLanguage(simState.parsedLang, w);
      if (!membership.inLang) {
        showStep1Error(
          "Invalid witness for the selected language.",
          membership.reason || "The custom string does not satisfy the language definition."
        );
        return;
      }
    }

    hideStep1Error();
    simState.w = w;
    simState.p = p;

    setupStep2View();
    goToStep(2);
  });

  // Step 2: String Analysis actions
  document.getElementById("btnBackToStep1").addEventListener("click", () => {
    goToStep(1);
  });

  document.getElementById("btnFindSplits").addEventListener("click", () => {
    simState.splits = generateValidSplits(simState.parsedLang, simState.w, simState.p);
    renderSplitsGrid();
    goToStep(3);
  });

  // Step 3: Splits Search actions
  document.getElementById("tabAutoSplits").addEventListener("click", () => {
    document.getElementById("tabAutoSplits").classList.add("active");
    document.getElementById("tabManualSplit").classList.remove("active");
    document.getElementById("autoSplitsContainer").classList.remove("hidden");
    document.getElementById("manualSplitContainer").classList.add("hidden");
  });

  document.getElementById("tabManualSplit").addEventListener("click", () => {
    document.getElementById("tabManualSplit").classList.add("active");
    document.getElementById("tabAutoSplits").classList.remove("active");
    document.getElementById("manualSplitContainer").classList.remove("hidden");
    document.getElementById("autoSplitsContainer").classList.add("hidden");

    document.getElementById("manualX").value = simState.splits[0] ? simState.splits[0].x : "";
    document.getElementById("manualY").value = simState.splits[0] ? simState.splits[0].y : "";
    document.getElementById("manualZ").value = simState.splits[0] ? simState.splits[0].z : "";
  });

  document.getElementById("btnFindAdversarial").addEventListener("click", () => {
    const adv = findAdversarialSplit(simState.parsedLang, simState.splits);
    selectSplitAndProceed(adv.splitIndex, true, adv.targetI);
  });

  document.getElementById("btnValidateManual").addEventListener("click", () => {
    validateManualSplit();
  });

  document.getElementById("btnUseManualSplit").addEventListener("click", () => {
    if (manualSplitCandidate) {
      simState.selectedSplit = manualSplitCandidate;
      simState.isAdversarialChosen = false;
      simState.currentI = 0;
      setupStep4View();
      goToStep(4);
    }
  });

  document.getElementById("btnBackToStep2").addEventListener("click", () => {
    goToStep(2);
  });

  // Step 4: Interactive Pumping actions
  document.querySelectorAll(".btn-i-num").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const iVal = parseInt(e.currentTarget.getAttribute("data-i"), 10);
      applyPump(iVal);
    });
  });

  document.getElementById("btnTryAnotherSplit").addEventListener("click", () => {
    goToStep(3);
  });

  document.getElementById("btnFinishExperiment").addEventListener("click", () => {
    setupStep5View();
    goToStep(5);
  });

  // Step 5: Final Result actions
  document.getElementById("btnRestartSameSplit").addEventListener("click", () => {
    goToStep(4);
  });

  document.getElementById("btnRestartOtherSplit").addEventListener("click", () => {
    goToStep(3);
  });

  document.getElementById("btnNewExperiment").addEventListener("click", () => {
    resetExperiment();
    goToStep(1);
  });

  // Initial State: Analyze default input and go to Welcome
  runAnalysisOnCurrentInput();
  goToStep(0);
});
