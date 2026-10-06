/**
 * ============================================================================
 * PUMPING LEMMA SIMULATOR - INTERACTIVE JAVASCRIPT ENGINE
 * College Project: Formal Languages and Automata Theory
 * ============================================================================
 * Features:
 *   - Progressive screen reveals (Step 1 -> 2 -> 3 -> 4 -> 5)
 *   - Dynamic string decomposition search (|xy| <= p, |y| > 0)
 *   - Machine adversarial split finder
 *   - Manual split specification mode with validation
 *   - Visual pumping animation (removing/duplicating Y blocks)
 *   - Live language check for every i (0, 1, 2, 3)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. FORMAL LANGUAGE DEFINITIONS
// ----------------------------------------------------------------------------
const LANGUAGES = {
  // L = { a^n b^n | n >= 0 }
  an_bn: {
    name: "L = { aⁿbⁿ | n ≥ 0 }",
    alphabet: ["a", "b"],
    hint: "Condition: Equal number of 'a's followed strictly by equal number of 'b's.",
    checkMembership: function(s) {
      if (s === "") return { inLang: true, countA: 0, countB: 0 };
      const match = s.match(/^(a+)(b+)$/);
      if (!match) {
        return {
          inLang: false,
          reason: "String must consist of 'a's followed strictly by 'b's (e.g. aaabbb)."
        };
      }
      const countA = match[1].length;
      const countB = match[2].length;
      if (countA !== countB) {
        return {
          inLang: false,
          countA: countA,
          countB: countB,
          reason: `The number of a's (${countA}) and b's (${countB}) is different.`
        };
      }
      return { inLang: true, countA: countA, countB: countB };
    }
  },

  // L = { a^n b^n c^n | n >= 0 }
  an_bn_cn: {
    name: "L = { aⁿbⁿcⁿ | n ≥ 0 }",
    alphabet: ["a", "b", "c"],
    hint: "Condition: Equal number of 'a's, followed by equal 'b's, followed by equal 'c's.",
    checkMembership: function(s) {
      if (s === "") return { inLang: true };
      const match = s.match(/^(a+)(b+)(c+)$/);
      if (!match) {
        return {
          inLang: false,
          reason: "String must consist of 'a's, then 'b's, then 'c's."
        };
      }
      const countA = match[1].length;
      const countB = match[2].length;
      const countC = match[3].length;
      if (countA !== countB || countB !== countC) {
        return {
          inLang: false,
          reason: `Count mismatch: ${countA} a's, ${countB} b's, and ${countC} c's.`
        };
      }
      return { inLang: true };
    }
  }
};

// ----------------------------------------------------------------------------
// 2. SIMULATOR EXPERIMENT STATE
// ----------------------------------------------------------------------------
const simState = {
  currentStep: 0, // 0 = welcome, 1 = input, 2 = analysis, 3 = splits, 4 = pump, 5 = result
  langKey: "an_bn",
  w: "aaabbb",
  p: 3,
  splits: [],
  selectedSplit: null,
  selectedSplitIndex: 0,
  isAdversarialChosen: false,
  currentI: 0,
  pumpedString: "abbb",
  isPumpedInLang: false,
  checkReason: ""
};

// ----------------------------------------------------------------------------
// 3. STEPPER & SCREEN TRANSITIONS
// ----------------------------------------------------------------------------
function goToStep(stepNum) {
  simState.currentStep = stepNum;

  // 1. Hide all screens, show active screen
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

  // 2. Update Progress Stepper Bar
  for (let s = 1; s <= 5; s++) {
    const stepEl = document.getElementById(`progStep${s}`);
    if (!stepEl) continue;

    stepEl.classList.remove("active", "completed");
    if (s === stepNum) {
      stepEl.classList.add("active");
    } else if (s < stepNum) {
      stepEl.classList.add("completed");
    }

    // Step lines
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

  // Scroll smoothly to top of simulator container
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ----------------------------------------------------------------------------
// 4. INPUT VALIDATION (STEP 1)
// ----------------------------------------------------------------------------
function validateInput(langKey, wVal, pVal) {
  const lang = LANGUAGES[langKey];

  // 1. String empty check
  if (!wVal || wVal.trim() === "") {
    return {
      isValid: false,
      title: "Please enter a string.",
      desc: "String w cannot be empty. Example: aaabbb"
    };
  }

  const w = wVal.trim();

  // 2. Pumping length numeric check
  const pNum = Number(pVal);
  if (pVal === "" || isNaN(pNum)) {
    return {
      isValid: false,
      title: "Invalid pumping length.",
      desc: "Pumping length p must be a valid number (e.g. 3)."
    };
  }

  if (pNum <= 0) {
    return {
      isValid: false,
      title: "Pumping length must be greater than 0.",
      desc: `The Pumping Lemma requires a positive integer p > 0. Received p = ${pNum}.`
    };
  }

  if (!Number.isInteger(pNum)) {
    return {
      isValid: false,
      title: "Pumping length must be an integer.",
      desc: `Pumping length p must be a whole number, got ${pNum}.`
    };
  }

  // 3. Alphabet characters check
  for (let char of w) {
    if (!lang.alphabet.includes(char)) {
      return {
        isValid: false,
        title: "This string does not match the selected language pattern.",
        desc: `String contains character '${char}'. The language allows only characters in { ${lang.alphabet.join(", ")} }.`
      };
    }
  }

  // 4. Language membership check
  const membership = lang.checkMembership(w);
  if (!membership.inLang) {
    return {
      isValid: false,
      title: "This string does not match the selected language pattern.",
      desc: membership.reason || "The input string does not belong to the selected language."
    };
  }

  // 5. Length constraint check (|w| >= p)
  if (w.length < pNum) {
    return {
      isValid: false,
      title: "String length is less than pumping length p.",
      desc: `String length (|w| = ${w.length}) is smaller than p (${pNum}). The Pumping Lemma applies to strings where |w| ≥ p.`
    };
  }

  return { isValid: true, w: w, p: pNum };
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

// ----------------------------------------------------------------------------
// 5. STEP 2: STRING ANALYSIS
// ----------------------------------------------------------------------------
function setupStep2View() {
  const tape = document.getElementById("step2Tape");
  tape.innerHTML = "";

  // Render individual character boxes with index numbers
  for (let i = 0; i < simState.w.length; i++) {
    const char = simState.w[i];
    const charBox = document.createElement("div");
    charBox.className = "tape-char";
    charBox.innerHTML = `<span>${char}</span><span class="char-index">${i + 1}</span>`;
    tape.appendChild(charBox);
  }

  document.getElementById("step2StrLen").textContent = `|w| = ${simState.w.length}`;
  document.getElementById("step2PLen").textContent = `p = ${simState.p}`;
}

// ----------------------------------------------------------------------------
// 6. STEP 3: DECOMPOSITION GENERATOR
// ----------------------------------------------------------------------------
/**
 * Calculates all decompositions w = xyz where:
 *   1. |xy| <= p
 *   2. |y| > 0
 */
function calculateValidSplits(w, p) {
  const splits = [];

  for (let xLen = 0; xLen < p; xLen++) {
    for (let yLen = 1; xLen + yLen <= p; yLen++) {
      const x = w.substring(0, xLen);
      const y = w.substring(xLen, xLen + yLen);
      const z = w.substring(xLen + yLen);

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
        <span>|xy| = ${split.xyLen} &le; ${simState.p}</span>
      </div>
      <div class="split-visual-preview">
        <span class="comp-x">[ ${xDisp} ]</span>
        <span class="comp-y">[ ${yDisp} ]</span>
        <span class="comp-z">[ ${zDisp} ]</span>
      </div>
      <div class="split-meta-text">
        X = "${xDisp}", Y = "${yDisp}", Z = "${zDisp}" (|y| = ${split.yLen} &gt; 0)
      </div>
    `;

    card.addEventListener("click", () => {
      selectSplitAndProceed(idx, false);
    });

    container.appendChild(card);
  });
}

function selectSplitAndProceed(index, isAdversarial) {
  simState.selectedSplitIndex = index;
  simState.selectedSplit = simState.splits[index];
  simState.isAdversarialChosen = isAdversarial;
  simState.currentI = 0; // Default to i = 0 to reveal pumping effect

  setupStep4View();
  goToStep(4);
}

// Adversarial split selector: finds split where i = 0 produces string outside L
function findAdversarialSplit() {
  const lang = LANGUAGES[simState.langKey];
  let bestIdx = 0;
  let maxScore = -1;

  for (let i = 0; i < simState.splits.length; i++) {
    const sp = simState.splits[i];
    const pumpedI0 = sp.x + sp.z; // y^0 is empty string
    const check = lang.checkMembership(pumpedI0);

    if (!check.inLang) {
      // Prefer canonical textbook splits with non-empty x and substantial y (e.g. x="a", y="aa", z="bbb")
      const score = (sp.x.length > 0 ? 10 : 0) + (sp.y.length * 2) + sp.xyLen;
      if (score > maxScore) {
        maxScore = score;
        bestIdx = i;
      }
    }
  }

  selectSplitAndProceed(bestIdx, true);
}

// ----------------------------------------------------------------------------
// 7. STEP 4: VISUAL STRING PARTITION & PUMPING ANIMATION
// ----------------------------------------------------------------------------
function setupStep4View() {
  const split = simState.selectedSplit;
  const advBanner = document.getElementById("advSuccessBanner");

  if (simState.isAdversarialChosen) {
    document.getElementById("advYText").textContent = `"${split.y}"`;
    advBanner.classList.remove("hidden");
  } else {
    advBanner.classList.add("hidden");
  }

  // 1. Render Partition Blocks for w = xyz: [ a ] [ a a ] [ b b b ]
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

  // Labels under visualizer
  document.getElementById("lblPartX").textContent = split.x === "" ? "ε" : split.x;
  document.getElementById("lblPartY").textContent = split.y;
  document.getElementById("lblPartZ").textContent = split.z === "" ? "ε" : split.z;

  // 2. Perform initial pump with i = 0
  applyPump(simState.currentI);
}

function applyPump(i) {
  simState.currentI = i;
  const split = simState.selectedSplit;
  const lang = LANGUAGES[simState.langKey];

  // Update button active state
  document.querySelectorAll(".btn-i-num").forEach(btn => {
    const btnI = parseInt(btn.getAttribute("data-i"), 10);
    if (btnI === i) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  // 1. Build formula text:
  let formulaText = "";
  if (i === 0) formulaText = `x + (y)⁰ + z  →  x + z  (Y removed)`;
  else if (i === 1) formulaText = `x + (y)¹ + z  →  x + y + z  (Original string)`;
  else if (i === 2) formulaText = `x + (y)² + z  →  x + y + y + z  (Y duplicated)`;
  else formulaText = `x + (y)³ + z  →  x + y + y + y + z  (Y repeated 3 times)`;

  document.getElementById("transformFormula").textContent = formulaText;

  // 2. Visual Chips Animation of Pumped String
  const flowContainer = document.getElementById("pumpedChipsFlow");
  flowContainer.innerHTML = "";

  function addChip(text, className) {
    if (text === "") return;
    const chip = document.createElement("span");
    chip.className = `pump-token-chip ${className}`;
    chip.textContent = text;
    flowContainer.appendChild(chip);
  }

  // X chip
  addChip(split.x, "box-x");

  // Y repeated i times
  for (let k = 0; k < i; k++) {
    addChip(split.y, "box-y");
  }

  // Z chip
  addChip(split.z, "box-z");

  // If entire pumped string is empty (epsilon)
  const pumpedStr = split.x + split.y.repeat(i) + split.z;
  simState.pumpedString = pumpedStr;

  if (pumpedStr === "") {
    const emptyChip = document.createElement("span");
    emptyChip.className = "pump-token-chip";
    emptyChip.textContent = "ε (empty string)";
    flowContainer.appendChild(emptyChip);
  }

  document.getElementById("pumpedStringVal").textContent = pumpedStr === "" ? "ε" : pumpedStr;

  // 3. STEP 6: Live Language Check
  const check = lang.checkMembership(pumpedStr);
  simState.isPumpedInLang = check.inLang;

  const liveBox = document.getElementById("liveCheckBox");
  const liveIcon = document.getElementById("liveCheckIcon");
  const liveTitle = document.getElementById("liveCheckTitle");
  const liveTag = document.getElementById("liveCheckTag");
  const liveReason = document.getElementById("liveCheckReason");

  if (!check.inLang) {
    liveBox.className = "live-check-box status-violation";
    liveIcon.textContent = "✗";
    liveTitle.textContent = `${pumpedStr} ∉ L`;
    liveTag.textContent = "Does NOT belong to L (Violation Found)";
    liveReason.textContent = check.reason || "The pumped string no longer satisfies the language conditions.";
    simState.checkReason = check.reason;
  } else {
    liveBox.className = "live-check-box status-safe";
    liveIcon.textContent = "✓";
    liveTitle.textContent = `${pumpedStr} ∈ L`;
    liveTag.textContent = "Belongs to L";
    liveReason.textContent = `For i = ${i}, the pumped string maintains equal counts. Try selecting i = 0 or i = 2 to see the violation!`;
    simState.checkReason = "Belongs to language for this value of i.";
  }
}

// ----------------------------------------------------------------------------
// 8. STEP 5: FINAL RESULT / CONCLUSION
// ----------------------------------------------------------------------------
function setupStep5View() {
  const split = simState.selectedSplit;
  const lang = LANGUAGES[simState.langKey];

  document.getElementById("finalSpecLang").textContent = lang.name;
  document.getElementById("finalSpecW").textContent = simState.w;
  document.getElementById("finalSpecSplit").textContent = `x = "${split.x}", y = "${split.y}", z = "${split.z}"`;
  document.getElementById("finalSpecI").textContent = `i = ${simState.currentI}`;
  document.getElementById("finalSpecPumped").textContent = simState.pumpedString === "" ? "ε" : simState.pumpedString;

  const finalBanner = document.getElementById("finalBanner");
  const bannerIcon = document.getElementById("finalBannerIcon");
  const bannerTitle = document.getElementById("finalBannerTitle");
  const bannerDesc = document.getElementById("finalBannerDesc");
  const specCheck = document.getElementById("finalSpecCheck");

  if (!simState.isPumpedInLang) {
    finalBanner.className = "final-banner banner-violation";
    bannerIcon.textContent = "❌";
    bannerTitle.textContent = "Violation Demonstrated";
    bannerDesc.textContent = "The pumped string no longer satisfies the language condition.";
    specCheck.className = "spec-v text-danger";
    specCheck.textContent = `${simState.pumpedString} ∉ L (Violation)`;
  } else {
    finalBanner.className = "final-banner banner-safe";
    bannerIcon.textContent = "✔️";
    bannerTitle.textContent = "String in Language (No Violation for this i)";
    bannerDesc.textContent = "Pumping with this particular i produced a string that remains in L.";
    specCheck.className = "spec-v text-success";
    specCheck.textContent = `${simState.pumpedString} ∈ L (In Language)`;
  }
}

// ----------------------------------------------------------------------------
// 9. MANUAL SPLIT MODE (STEP 8)
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
    fbText.innerHTML = `<strong>Invalid decomposition:</strong> x + y + z ("${x + y + z}") does not equal original string w ("${simState.w}").`;
    useBtn.classList.add("hidden");
    manualSplitCandidate = null;
    return;
  }

  // Condition 2: |xy| <= p
  if (x.length + y.length > simState.p) {
    feedback.className = "alert-box alert-danger";
    fbIcon.textContent = "✗";
    fbText.innerHTML = `<strong>Invalid decomposition:</strong> |xy| = ${x.length + y.length}, which exceeds pumping length p = ${simState.p}. Condition requires |xy| &le; p.`;
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

  // Passed all 3 Pumping Lemma conditions!
  feedback.className = "alert-box alert-success";
  fbIcon.textContent = "✓";
  fbText.innerHTML = `<strong>Valid decomposition!</strong> Satisfies w = xyz, |xy| = ${x.length + y.length} &le; ${simState.p}, and |y| = ${y.length} &gt; 0.`;
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
// 10. PRESET EXAMPLES (STEP 9)
// ----------------------------------------------------------------------------
function loadPresetExample(caseNum) {
  if (caseNum === 1) {
    // Valid Example 1: L = a^n b^n, w = aaabbb, p = 3
    document.getElementById("selectLang").value = "an_bn";
    document.getElementById("inputW").value = "aaabbb";
    document.getElementById("inputP").value = 3;
    hideStep1Error();
    goToStep(1);
  } else if (caseNum === 2) {
    // Invalid Example 2: w = aaabb, p = 0
    document.getElementById("selectLang").value = "an_bn";
    document.getElementById("inputW").value = "aaabb";
    document.getElementById("inputP").value = 0;
    goToStep(1);
    showStep1Error("Pumping length must be greater than 0.", "The Pumping Lemma requires a positive integer p > 0. Received p = 0.");
  } else if (caseNum === 3) {
    // Invalid Example 3: w = abc, p = 3
    document.getElementById("selectLang").value = "an_bn";
    document.getElementById("inputW").value = "abc";
    document.getElementById("inputP").value = 3;
    goToStep(1);
    showStep1Error("This string does not match the selected language pattern.", "String contains character 'c'. The language allows only characters in { a, b }.");
  }
}

// ----------------------------------------------------------------------------
// 11. EVENT LISTENERS INITIALIZATION
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

  // Step 1: Input Form actions
  document.getElementById("selectLang").addEventListener("change", (e) => {
    const k = e.target.value;
    document.getElementById("langFormatHint").textContent = LANGUAGES[k].hint;
  });

  document.getElementById("btnBackToWelcome").addEventListener("click", () => {
    goToStep(0);
  });

  document.getElementById("btnStartExperiment").addEventListener("click", () => {
    const langKey = document.getElementById("selectLang").value;
    const wVal = document.getElementById("inputW").value;
    const pVal = document.getElementById("inputP").value;

    const validation = validateInput(langKey, wVal, pVal);
    if (!validation.isValid) {
      showStep1Error(validation.title, validation.desc);
      return;
    }

    hideStep1Error();
    simState.langKey = langKey;
    simState.w = validation.w;
    simState.p = validation.p;

    setupStep2View();
    goToStep(2);
  });

  // Step 2: String Analysis actions
  document.getElementById("btnBackToStep1").addEventListener("click", () => {
    goToStep(1);
  });

  document.getElementById("btnFindSplits").addEventListener("click", () => {
    simState.splits = calculateValidSplits(simState.w, simState.p);
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

    // Prepopulate manual inputs with example
    document.getElementById("manualX").value = simState.splits[0] ? simState.splits[0].x : "";
    document.getElementById("manualY").value = simState.splits[0] ? simState.splits[0].y : "";
    document.getElementById("manualZ").value = simState.splits[0] ? simState.splits[0].z : "";
  });

  document.getElementById("btnFindAdversarial").addEventListener("click", () => {
    findAdversarialSplit();
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
    goToStep(1);
  });

  // Initial State: Start at Welcome Screen (0)
  goToStep(0);
});
