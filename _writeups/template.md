---
layout: writeup
title: exatlon_v1
source: HackTheBox
date: 2025-01-01
read_time: 5 mins
---
This challenge involved a buffer overflow that was easy to exploit once the canary was leaked.

{% include code.html lang="c" code="char buf[64];
gets(buf);" %}

After leaking the stack canary, we were able to use a one-gadget to pop a shell.
