---
published: false
layout: writeup
title: Missioncritical1
source: SunshineCTF
category: Re
date: 2025-09-28
---
First run:
```bash
Satellite Status: Battery=80%, Orbit=32, Temp=-25C
Enter satellite command: turn left
Access Denied!
```
Because of the access denied message, I think I could try to elevate privileges:
```bash
Satellite Status: Battery=80%, Orbit=32, Temp=-25C
Enter satellite command: sudo turn left
Access Denied!
```
I was wrong.
Ghidra solves the challenge for me.
```C
undefined8 main(void)

{
  int cmp_res;
  long in_FS_OFFSET;
  char acStack_98 [64];
  char input [56];
  long canary;
  
  canary = *(long *)(in_FS_OFFSET + 0x28);
  sprintf(acStack_98,"sun{%s_%s_%s}\n",&e4sy,"s4t3ll1t3",&3131);
  time((time_t *)0x0);
  printf("Satellite Status: Battery=%d%%, Orbit=%d, Temp=%dC\n",80,32,0xffffffe7);
  printf("Enter satellite command: ");
  fgets(input,50,stdin);
  cmp_res = strcmp(input,acStack_98);
  if (cmp_res == 0) {
    puts("Access Granted!");
  }
  else {
    puts("Access Denied!");
  }
  if (canary == *(long *)(in_FS_OFFSET + 0x28)) {
    return 0;
  }
                    /* WARNING: Subroutine does not return */
  __stack_chk_fail();
}
```
My input is compared against the input in acStack_98, which is defined at the top of the function.
# Flag
```bash
sun{e4sy_s4t3ll1t3_3131}
```
