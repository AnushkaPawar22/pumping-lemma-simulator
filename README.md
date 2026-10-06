# Pumping Lemma Simulator (Interactive Web Application)

> **Formal Languages and Automata Theory — Interactive College Project**  
> A progressive, step-by-step interactive simulator demonstrating the Pumping Lemma for Regular Languages.

---

## 🎮 Main User Experience & Philosophy

Unlike static dashboards that dump all data onto one screen, this application is built as an **interactive simulator**:
- **Experiment → Action → Response → Next Action**
- The user does **not** see all results immediately.
- The experiment unfolds step-by-step across 5 progressive stages.

---

## 🧭 The 5-Step Progressive Experiment Flow

```
1 Input  →  2 String w  →  3 Split xyz  →  4 Pump y  →  5 Result
```

### 1. Welcome Screen
- Welcomes the student with a clean, educational interface.
- Includes **"Start Simulation →"** and a **"Try Examples …"** drawer featuring predefined valid and invalid test cases.

### 2. Step 1 — Enter the Experiment
- Select target language: $L = \{a^n b^n \mid n \ge 0\}$ or $L = \{a^n b^n c^n \mid n \ge 0\}$.
- Enter witness string $w$ (e.g. `aaabbb`) and pumping length $p$ (e.g. `3`).
- **Input Validation**: Verifies that $w \in L$, $|w| \ge p$, and $p > 0$. Displays inline error alerts if invalid.

### 3. Step 2 — String Analysis
- Visually inspects the witness string as an animated character tape:
  `[ a₁ ] [ a₂ ] [ a₃ ] [ b₄ ] [ b₅ ] [ b₆ ]`
- Checks the condition $|w| \ge p$ before generating partitions.

### 4. Step 3 — Systematic Decomposition Search
- Dynamically computes all legal splits $w = xyz$ satisfying:
  1. $|xy| \le p$
  2. $|y| > 0$
- **Two Modes available**:
  - **Systematic Splits Cards**: Shows all valid combinations calculated in JavaScript. Click any card to test it!
  - **⚡ Find Adversarial Split**: Lets the machine automatically pick the split that breaks language membership (e.g., $x = \text{"a"}, y = \text{"aa"}, z = \text{"bbb"}$).
  - **Manual Split Mode**: Allows students to enter custom $X, Y, Z$ substrings and validates whether they satisfy the Pumping Lemma conditions.

### 5. Step 4 — Interactive Pumping & Live Language Check
- **Visual String Animation**:
  - Displays partition boxes: `[ a ] [ a a ] [ b b b ]` with labels $X, Y, Z$.
  - **Interactive $i$ buttons**: `i = 0`, `i = 1`, `i = 2`, `i = 3`.
  - **$i = 0$ (Pump Down)**: Visually removes $Y \rightarrow [ a ] [ b b b ] \rightarrow \mathbf{abbb} \notin L$ (1 'a' vs 3 'b's).
  - **$i = 1$**: Original string $\rightarrow \mathbf{aaabbb} \in L$.
  - **$i = 2$ (Pump Up)**: Duplicates $Y \rightarrow [ a ] [ a a ] [ a a ] [ b b b ] \rightarrow \mathbf{aaaaabbb} \notin L$.
  - **Live Language Check**: Automatically updates membership and provides plain-English reasoning on every button click.

### 6. Step 5 — Final Result & Academic Conclusion
- Full formal summary: Language, Original String, Selected Split, Tested Exponent $i$, Pumped String, and Final Verdict.
- Includes expandable academic note explaining that a complete proof requires showing all valid splits fail.
- Options to:
  - **Test Another $i$**
  - **Try Another Split**
  - **New Experiment**

---

## 🧪 Verified Test Walkthrough

```
Start Simulation
   ↓
Enter aaabbb, p = 3
   ↓
Start Experiment
   ↓
Find Splits
   ↓
Find Adversarial Split (Selects x="a", y="aa", z="bbb")
   ↓
Click i = 0  →  Generates abbb      →  abbb ∉ L (1 'a' vs 3 'b's)
   ↓
Click i = 1  →  Generates aaabbb    →  aaabbb ∈ L
   ↓
Click i = 2  →  Generates aaaaabbb  →  aaaaabbb ∉ L (5 'a's vs 3 'b's)
```

---

## 🚀 How to Run

1. Open the project folder.
2. Double-click **`index.html`** in any web browser.
3. Completely standalone — pure HTML5, CSS3, and vanilla JavaScript.
