// The agent writes math as \[ ... \] and \( ... \); remark-math only knows $. Has
// to run before markdown parses - CommonMark turns \[ into a bare [, and the escape
// is gone by the time there's an AST.

// Capturing, so split() keeps the code spans instead of dropping them.
const CODE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;

// Closing delimiter required, so a half-streamed \[ stays literal until the \]
// lands instead of flashing a stray $$.
const DISPLAY = /\\\[([\s\S]+?)\\\]/g;
const INLINE = /\\\(([\s\S]+?)\\\)/g;

export function normalizeMath(text: string): string {
  return text
    .split(CODE)
    .map((part, i) =>
      i % 2 // odd indices are code spans
        ? part
        : part
            .replace(DISPLAY, (_, body: string) => `$$${body}$$`)
            .replace(INLINE, (_, body: string) => `$${body}$`),
    )
    .join("");
}
