---
published: true
layout: writeup
title: ExceLLM
source: SunshineCTF
category: Re
date: 2025-09-27
---
This challenge was extremely easy. I was provided with an excel file that takes input and based on the input prints either correct or incorrect. That output is determined by 3 other sheets within the file that were initially hidden. I had to right click on the unhidden sheet to unhide the other sheets.
The final output was determined by the status of the VERIFY sheet's Z1 cell, which basically did a lot of math on the input based on weights and balances.
Instead of manually going through and figuring all that out, I gave the file to ChatGPT and it gave me the answer.
# Flag
```bash
sun{n0t_qu1t3_ch4t_GPT_l0l}
```
