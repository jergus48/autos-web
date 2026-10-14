# Extra site languages

Each language besides English, Lithuanian and German registers its strings for the
shared scripts in `i18n/<lang>.js`, which is loaded with a plain `<script>` tag
before the other scripts on every page of that language. Shape:

```js
(window.SWX_I18N = window.SWX_I18N || {}).fr = {
  locale: 'fr-FR',            // Intl locale for the savings calculator
  themeLabel: [...],          // js/pages.js: [switch to dark, switch to light]
  assistantT: {...},          // assistant/assistant.js: same shape as the `de` block of T
  assistantCases: {...},      // assistant/assistant.js: same shape as the `de` block of CASES
  calcT: {...},               // assistant/calculator.js: same shape as the `de` block of T
  demoT: {...},               // demo/demo.js: same shape as the `de` block of T
  demoSamples: [...],         // demo/demo.js: same shape as the `de` array of SAMPLES
  faq: {...},                 // js/vex-fix.js: "question text": "answer" pairs for the home FAQ
  heroWords: [...],           // js/deck-motion.js: lowercase words of the home <h1> to highlight
  aboutLabel: '/ ...',        // js/deck-motion.js: eyebrow above the "not an agency" heading
  aboutWords: [...]           // js/deck-motion.js: lowercase word(s) to highlight in that heading
}
```
