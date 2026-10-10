# Pumping Lemma Simulator (Generic & User-Input Driven Engine)

> **Formal Languages and Automata Theory — Interactive College Project**  
> A progressive, step-by-step interactive simulator demonstrating the Pumping Lemma for Regular Languages.  
> Powered by an extensible **Generic Formal Language Parser & AST Engine**.

---

## 🎮 Main User Experience & Philosophy

Unlike static dashboards or simulators restricted to hard-coded languages, this application is:
- **Generic & User-Input Driven**: Students can type arbitrary formal language equations with custom variables (`m`, `n`, `k`, `p`, `i`, etc.).
- **Interactive & Step-by-Step**: The experiment unfolds progressively across 5 stages without revealing all answers immediately.
- **Mathematically Honest**: Never fakes results. If an unsupported equation is entered, it clearly informs the student and offers recognized patterns.

---

## 🧭 The 5-Step Progressive Experiment Flow

```
1 Define Language  →  2 Witness w  →  3 Split xyz  →  4 Pump y  →  5 Result
```

### 1. Step 1 — Define Language & Configure Parameters
- **Two Flexible Selection Modes**:
  - **✏️ Custom Language / Equation**: Enter any equation (e.g. `L = {0^m 1^n 0^m | m,n >= 0}`). Includes one-click quick pattern chips for testing.
  - **📚 Predefined Languages**: Grid of standard textbook cases with mathematical notation.
- **Extensible Parser & Detected Interpretation Card**:
  - Dynamically extracts alphabet symbols, variables, exponents, block order, and equality constraints.
  - Displays the live **"Detected Language"** breakdown:
    - *Detected Pattern*: `0ᵐ → 1ⁿ → 0ᵐ`
    - *Detected Constraints*:
      - `✓ First and last 0-blocks have equal length (m = m)`
      - `✓ Middle 1-block is independent (exponent n)`
      - `✓ Alphabet: { 0, 1 }`
      - `✓ Exponents: m ≥ 0, n ≥ 0`
- **Pumping Length $p$**:
  - Validates positive integers $p > 0$ (rejects empty, negative, zero, and decimals).
- **Dual Witness Modes**:
  - *Generate Automatically*: Derives a canonical witness string based on the parsed AST.
  - *Enter Custom Witness*: Validates student-provided string against language rules and $|w| \ge p$.

### 2. Step 2 — Witness String Analysis
- Displays the parsed language definition, pumping length $p$, and dynamic formula.
- Visual character tape: `[ 0₁ ] [ 0₂ ] [ 0₃ ] [ 1₄ ] [ 1₅ ] [ 1₆ ] [ 0₇ ] [ 0₈ ] [ 0₉ ]`.
- Confirms the Pumping Lemma prerequisite: $|w| \ge p \checkmark$.
- Educational callout: *"Why this witness?"*

### 3. Step 3 — Systematic Decomposition Search ($w = xyz$)
- Dynamically calculates all legal splits obeying:
  1. $|xy| \le p$
  2. $|y| > 0$
- **⚡ Find Adversarial Split**: Machine adversary tests decompositions and selects the split that breaks language membership.
- **Manual Custom Split Mode**: Students can specify custom $X, Y, Z$ substrings with live condition verification.
- Educational callout: *"Why this split?"*

### 4. Step 4 — Interactive Pumping ($xy^i z$) & Live Language Check
- **Visual Token Chips**: Renders partitions $X$, $Y$, and $Z$ with dynamic duplication/removal animations.
- **Interactive Exponent Controls**: Test $i = 0$, $i = 1$, $i = 2$, $i = 3$.
- **Dynamic Rule-Based Membership Evaluator**:
  - `isInLanguage(parsedLanguage, string)` evaluates the AST constraints dynamically.
  - Returns `✓ IN LANGUAGE` or `✗ NOT IN LANGUAGE` with plain-English reasons:
    - *"Equality constraint broken for variable 'm': Block 1 (0) has length 2, but Block 3 (0) has length 3."*
    - *"Second half does not match reversed first half."*
    - *"Length 4 is composite (divisible by 2)."*
- Educational callout: *"Why pump?"*

### 5. Step 5 — Final Result & Theoretical Conclusion
- Dynamic verdict card: `✓ COUNTEREXAMPLE FOUND` or `String in Language`.
- Formal summary table: Target Language, Original Witness, Selected Split, Exponent $i$, Pumped String, Membership Verdict.
- Expandable Theory of Computation note explaining the formal proof implications.
- Navigation actions: *Test Another $i$*, *Try Another Split*, *New Experiment →*.

---

## 📐 Supported General Pattern Types

| Category | Example Equation | Parsed Rule |
| :--- | :--- | :--- |
| **Equal Outer Blocks** | `L = {0^m 1^n 0^m \| m,n >= 0}` | $count(0_{\text{first}}) = count(0_{\text{last}})$, $n$ independent |
| **Equal Powers (2)** | `L = {a^n b^n \| n >= 1}` | $count(a) = count(b) \ge 1$ |
| **Equal Powers (3)** | `L = {a^n b^n c^n \| n >= 1}` | $count(a) = count(b) = count(c) \ge 1$ |
| **Binary Equal Powers** | `L = {0^n 1^n \| n >= 0}` | $count(0) = count(1) \ge 0$ |
| **Independent Powers** | `L = {a^n b^m \| n,m >= 0}` | Independent concatenation over $\{a, b\}$ |
| **Repeated Blocks** | `L = {a^n b^m a^n \| n,m >= 0}` | First $a$-block equals last $a$-block |
| **Repeated Blocks** | `L = {a^m b^m c^k \| m,k >= 0}` | $a$-block equals $b$-block, $k$ independent |
| **Exact Duplicate String** | `L = {ww \| w in {0,1}*}` | $w_1 = w_2$ (identical halves) |
| **Even Palindrome** | `L = {ww^R \| w in {a,b}*}` | $w_2 = reverse(w_1)$ |
| **Marked Palindrome** | `L = {wcw^R \| w in {a,b}*}` | Midpoint separator $c$, left equals $reverse(\text{right})$ |
| **Unary Prime** | `L = {a^n \| n is prime}` | Length is a prime number $\ge 2$ |
| **Unary Square** | `L = {a^(n^2) \| n >= 1}` | Length is a perfect square |

---

## 🚀 How to Run

1. Open the project directory.
2. Double-click or open **`index.html`** in any modern web browser.
3. Completely standalone — pure HTML5, CSS3, and vanilla JavaScript.
