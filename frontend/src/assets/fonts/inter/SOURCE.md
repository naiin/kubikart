# Inter font source

`Inter-Variable.woff2` is a Latin-focused subset of the upright variable WOFF2
from the official Inter 4.1 release:

- Project: https://github.com/rsms/inter
- Release: https://github.com/rsms/inter/releases/tag/v4.1
- Archive path: `web/InterVariable.woff2`
- Supported weight axis: 100–900

The subset is redistributed under the unchanged SIL Open Font License 1.1 in
`OFL.txt`. The original's 100–900 weight and 14–32 optical-size axes and all layout
features are retained. This does not change the selected font family or design.

On 19 October 2026, FontTools 4.65.0 reduced the file from 352,240 to 206,112 bytes.
Coverage includes Latin and Latin Extended characters, combining marks,
punctuation, currency symbols, arrows and mathematical symbols. All characters
in the DE/EN translation files that existed in the original font were verified
against the subset's cmap; none were lost. Removed scripts such as Cyrillic and
Greek use the browser's fallback font if entered in customer content.

To reproduce from the original release's `InterVariable.woff2`:

```sh
pyftsubset InterVariable.woff2 \
  --output-file=Inter-Variable.woff2 --flavor=woff2 \
  --unicodes='U+0000-024F,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+FEFF' \
  --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*' \
  --notdef-glyph --notdef-outline --recommended-glyphs
```
