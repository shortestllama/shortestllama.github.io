---
published: false
layout: writeup
title: BASEic
source: SunshineCTF
category: Re
date: 2025-09-28
---
I start by running the program to see what it wants:
```bash
What is the flag> sun{FLAG}
You don't get the flag that easily
```
Obviously, it wants the flag...
The name of the challenge leads me to believe there might be some simple base64 encryption, so I check strings.
```bash
PTE1
u+UH
yX0I0NTMH
1fQ=f
c3Vue2MwdjNyMW5nX3V
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
What is the flag> 
%40s
You got it, submit the flag!
Soo Close
Closer
You don't get the flag that easily
```
These are the only strings of note and it looks like I could be correct about my base64 hypothesis.
I decide to open it in ghidra to see if I have any better luck there.
```C
undefined8 main(void)

{
  int cmp_res;
  size_t len_guess;
  char *encrypted;
  long in_FS_OFFSET;
  undefined8 secret;
  undefined4 secret+8;
  undefined2 secret+12;
  char guess [56];
  long canary;
  
  canary = *(long *)(in_FS_OFFSET + 0x28);
  secret = 0x4d544e3049305879;
  secret+8 = 0x3d516631;
  secret+12 = 0x3d;
  printf("What is the flag> ");
  __isoc99_scanf(&%40s,guess);
  len_guess = strlen(guess);
  if (len_guess == 22) {
    len_guess = strlen(guess);
    encrypted = (char *)FUN_001012c6(guess,len_guess);
    cmp_res = strncmp(encrypted,"c3Vue2MwdjNyMW5nX3V",19);
    if (cmp_res == 0) {
      len_guess = strlen((char *)&secret);
      cmp_res = strncmp(encrypted + 19,(char *)&secret,len_guess);
      if (cmp_res == 0) {
        puts("You got it, submit the flag!");
      }
      else {
        puts("Soo Close");
      }
    }
    else {
      puts("Closer");
    }
    free(encrypted);
  }
  else {
    puts("You don\'t get the flag that easily");
  }
  if (canary != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}
```
Right away I notice a length check against 22 that will get me a little closer to the answer, but inspecting just a little closer reveals that the desired input is right at the top of the function, seemingly, in base64. I will extract the contents and throw it into ![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=eVgwSTBOVE0xZlE9PQ) to see if I'm correct.
```bash
yX0I0NTM1fQ==
```
```bash
É}ÐÔÌÕô
```
I was incorrect.
Now I will do some more experimentation, starting with passing the 22 length check and then looking into the function that seems to encrypt the input.
I was correct about the length check of 22:
```bash
What is the flag> abcdabcdabcdabcdabcdab
Closer
```
The encryption function has a lot of details that I will not try to get into because I think there is an easier way to solve this challenge.
```C
void * encrypt(long guess,ulong len_guess)

{
  void *ret;
  long modified_len;
  ulong offset_kinda;
  ulong j;
  long i;
  
  if ((guess == 0) || (len_guess == 0)) {
    ret = (void *)0x0;
  }
  else {
    modified_len = do_math(len_guess);
    ret = malloc(modified_len + 1);
    *(undefined *)(modified_len + (long)ret) = 0;
    i = 0;
    for (j = 0; j < len_guess; j = j + 3) {
      if (j + 1 < len_guess) {
        offset_kinda = (long)*(char *)(guess + j + 1) | (long)*(char *)(j + guess) << 8;
      }
      else {
        offset_kinda = (long)*(char *)(j + guess) << 8;
      }
      if (j + 2 < len_guess) {
        offset_kinda = (long)*(char *)(guess + j + 2) | offset_kinda << 8;
      }
      else {
        offset_kinda = offset_kinda << 8;
      }
      *(char *)((long)ret + i) =
           "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
           [(uint)(offset_kinda >> 0x12) & 0x3f];
      *(char *)(i + 1 + (long)ret) =
           "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
           [(uint)(offset_kinda >> 0xc) & 0x3f];
      if (j + 1 < len_guess) {
        *(char *)(i + 2 + (long)ret) =
             "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
             [(uint)(offset_kinda >> 6) & 0x3f];
      }
      else {
        *(undefined *)((long)ret + i + 2) = 0x3d;
      }
      if (j + 2 < len_guess) {
        *(char *)(i + 3 + (long)ret) =
             "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
             [(uint)offset_kinda & 0x3f];
      }
      else {
        *(undefined *)((long)ret + i + 3) = 0x3d;
      }
      i = i + 4;
    }
  }
  return ret;
}
```
Using gdb, I determine the output of the encryption function dynamically based on my input of "abcdabcdabcdabcdabcdab".
```gdb
YWJjZGFiY2RhYmNkYWJjZGFiY2RhYg==
```
This is exactly the same as base64 encryption: ![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=WVdKalpHRmlZMlJoWW1Oa1lXSmpaR0ZpWTJSaFlnPT0)
Now I just need to see what it's compared against, base64 that, and I'll have my flag.
Obviously, it's compared against the thing that it says it is in ghidra:
```gdb
c3Vue2MwdjNyMW5nX3V
```
![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=YzNWdWUyTXdkak55TVc1blgzVg)
This gives us:
```bash
sun{c0v3r1ng_u
```
but that's only the first 19 characters. We still need at least 3 more...
Continuing on in gdb, we come to another strcmp(), comparing against
```gdb
yX0I0NTM1fQ==
```
which is what I thought the full answer was originally. The only difference compared to before is that base64 is iterative, so applying it on only a portion of the value doesn't work the way it should, so I need to combine both parts to get my full flag: ![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=YzNWdWUyTXdkak55TVc1blgzVnlYMEkwTlRNMWZRPT0)
```bash
c3Vue2MwdjNyMW5nX3VyX0I0NTM1fQ==
```
# Flag
```bash
sun{c0v3r1ng_ur_B4535}
```
