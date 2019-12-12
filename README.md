# ECLjs - https://priw8.github.io/ECLjs/

## What is this?
An interpreter of compiled ECL (Enemy Control Language) scripts used by modern Touhou games (th10+ format, th13+ instruction numbers). It only implements the basic opcodes, the so-called system instructions (ins_0 - ins_93). Non-stack variables mostly don't exist, apart from `RAND`, which works as expected, and `SPELL_ID`, which is always -1. Reading from other variables returns 0.

## Sources/credits/etc
- everyone who worked on [thecl](https://github.com/thpatch/thtk/tree/master/thecl) 
- documentation on [THBWiki](https://thwiki.cc/%E8%84%9A%E6%9C%AC%E5%AF%B9%E7%85%A7%E8%A1%A8/ECL)
- [Instruction table](https://priw8.github.io/#s=modding/ins) and [variable table](https://priw8.github.io/#s=modding/vars) on my webpage
- various research by me, Dai and 32th
