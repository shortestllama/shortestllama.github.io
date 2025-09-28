---
published: false
layout: writeup
title: Palatine Pack
source: SunshineCTF
category: Re
date: 2025-09-27
---
Running the program, it asks for a password:
```bash

May Jupiter strike you down Caeser before you seize the treasury!! You will have to tear me apart
for me to tell you the flag to unlock the Roman Treasury and fund your civil war. I, Lucius Caecilius
Metellus, shall not let you pass until you get this password right. (or threaten to kill me-)

zsh: segmentation fault  ./palatinepack

```
This seems like a pretty basic password discovery RE challenge.
This one's big - it doesn't seem fun, but it seems simple, just a lot of work to do for it.
Ok, so I went back and realized there's a flag.txt file which I didn't download before. After downloading it, I still get the segmentation fault, but I also see a palatinepackflag.txt file that gets opened in the main function:
```C
undefined8 main(void)

{
  byte bVar1;
  undefined *puVar2;
  void *__ptr;
  int iVar3;
  long lVar4;
  ulong uVar5;
  undefined8 uVar6;
  FILE *flag_file;
  undefined *i;
  long in_FS_OFFSET;
  undefined auStack_88 [8];
  int local_80;
  int local_7c;
  FILE *chal_file;
  long local_70;
  undefined *local_68;
  undefined8 local_60;
  undefined8 local_58;
  void *local_50;
  FILE *local_48;
  long canary;
  
  canary = *(long *)(in_FS_OFFSET + 0x28);
  puts(
      "\nMay Jupiter strike you down Caeser before you seize the treasury!! You will have to tear me  apart"
      );
  puts(
      "for me to tell you the flag to unlock the Roman Treasury and fund your civil war. I, Lucius C aecilius"
      );
  puts(
      "Metellus, shall not let you pass until you get this password right. (or threaten to kill me-) \n"
      );
  chal_file = fopen("palatinepackflag.txt","r");
  fseek(chal_file,0,2);
  lVar4 = ftell(chal_file);
  local_7c = (int)lVar4 + 1;
  fseek(chal_file,0,0);
  local_70 = (long)local_7c + -1;
  uVar5 = (((long)local_7c + 0xfU) / 0x10) * 0x10;
  for (i = auStack_88; i != auStack_88 + -(uVar5 & 0xfffffffffffff000); i = i + -0x1000) {
    *(undefined8 *)(i + -8) = *(undefined8 *)(i + -8);
  }
  lVar4 = -(ulong)((uint)uVar5 & 0xfff);
  if ((uVar5 & 0xfff) != 0) {
    *(undefined8 *)(i + ((ulong)((uint)uVar5 & 0xfff) - 8) + lVar4) =
         *(undefined8 *)(i + ((ulong)((uint)uVar5 & 0xfff) - 8) + lVar4);
  }
  flag_file = chal_file;
  iVar3 = local_7c;
  local_68 = i + lVar4;
  *(undefined8 *)(i + lVar4 + -8) = 0x101bfa;
  fgets(i + lVar4,iVar3,flag_file);
  puVar2 = local_68;
  iVar3 = local_7c;
  *(undefined8 *)(i + lVar4 + -8) = 0x101c0b;
  flipBits(puVar2,iVar3);
  puVar2 = local_68;
  iVar3 = local_7c;
  *(undefined8 *)(i + lVar4 + -8) = 0x101c1c;
  uVar6 = expand(puVar2,iVar3);
  iVar3 = local_7c * 2;
  local_60 = uVar6;
  *(undefined8 *)(i + lVar4 + -8) = 0x101c34;
  uVar6 = expand(uVar6,iVar3);
  iVar3 = local_7c * 4;
  local_58 = uVar6;
  *(undefined8 *)(i + lVar4 + -8) = 0x101c50;
  local_50 = (void *)expand(uVar6,iVar3);
  *(undefined8 *)(i + lVar4 + -8) = 0x101c5e;
  anti_debug();
  for (local_80 = 0; local_80 < local_7c * 8; local_80 = local_80 + 1) {
    bVar1 = *(byte *)((long)local_50 + (long)local_80);
    *(undefined8 *)(i + lVar4 + -8) = 0x101c81;
    putchar((uint)bVar1);
  }
  *(undefined8 *)(i + lVar4 + -8) = 0x101c9a;
  putchar(10);
  *(undefined8 *)(i + lVar4 + -8) = 0x101cb3;
  flag_file = fopen("flag.txt","wb");
  __ptr = local_50;
  iVar3 = local_7c << 3;
  local_48 = flag_file;
  *(undefined8 *)(i + lVar4 + -8) = 0x101cd5;
  fwrite(__ptr,1,(long)iVar3,flag_file);
  flag_file = local_48;
  *(undefined8 *)(i + lVar4 + -8) = 0x101ce1;
  fclose(flag_file);
  if (canary != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}
```
Therefore, I create that file in this directory and finally get some output I can use.
```bash

May Jupiter strike you down Caeser before you seize the treasury!! You will have to tear me apart
for me to tell you the flag to unlock the Roman Treasury and fund your civil war. I, Lucius Caecilius
Metellus, shall not let you pass until you get this password right. (or threaten to kill me-)

fiefiefie���6▒�>�
```
Next, I try changing the contents of the palatinepackflag.txt file and get a different output:
```bash

May Jupiter strike you down Caeser before you seize the treasury!! You will have to tear me apart
for me to tell you the flag to unlock the Roman Treasury and fund your civil war. I, Lucius Caecilius
Metellus, shall not let you pass until you get this password right. (or threaten to kill me-)

fiefiefie���6▒�>��:=����▒1�0���=������<▒�2���09����7�4���3������2�6���65����=�8��K9������8�:��]<1����3�<��?���
```
This confirms my hypothesis that the flag.txt file has some type of encryption that only having the correct "password" for inside the palatinepackflag.txt file will decrypt and reveal the flag. I need to do more reverse engineering in order to figure out how the encryption works.
```C
  chal_file = fopen("palatinepackflag.txt","r");
  fseek(chal_file,0,2);
```
This opens the file and sets the position to the end of the file. Followed by
```C
  last_index = ftell(chal_file);
  file_size = (int)last_index + 1;
```
gets the file size.
Ok, so after some reverse engineering, I kinda just realized that the anti_debug() function is only called before opening the flag.txt file. I assume this is because they want to protect the contents of that file once the decoding has occurred. However, they way they did it is not good because it can be bypassed easily.
```C
  anti_debug();
  for (j = 0; j < file_size * 8; j = j + 1) {
    bVar1 = *(byte *)((long)local_50 + (long)j);
    *(undefined8 *)(i + last_index + -8) = 0x101c81;
    putchar((uint)bVar1);
  }
  *(undefined8 *)(i + last_index + -8) = 0x101c9a;
  putchar(10);
  *(undefined8 *)(i + last_index + -8) = 0x101cb3;
  flag_file = fopen("flag.txt","wb");
  __ptr = local_50;
  iVar3 = file_size << 3;
  local_48 = flag_file;
  *(undefined8 *)(i + last_index + -8) = 0x101cd5;
  fwrite(__ptr,1,(long)iVar3,flag_file);
  flag_file = local_48;
  *(undefined8 *)(i + last_index + -8) = 0x101ce1;
  fclose(flag_file);
```
The anti_debug() function is called just before flag.txt is opened, but it can be bypassed by either patching the binary or just using the set command in gdb...
```C
void anti_debug(void)

{
  long ret_val;
  
  ret_val = ptrace(PTRACE_TRACEME,0,1,0);
  if (ret_val == -1) {
    puts("THOU SHALL NOT READ MY MIND WITH GOTHIC MAGIC CAESER!!!\n");
                    /* WARNING: Subroutine does not return */
    exit(1);
  }
  return;
}
```
So, during this sequence:
```C
  flag_file = fopen("flag.txt","wb");
  __ptr = contents_of_flag.txt;
  file_size_in_bits = file_size << 3;
  local_48 = flag_file;
  *(undefined8 *)(i + last_index + -8) = 0x101cd5;
  fwrite(__ptr,1,(long)file_size_in_bits,flag_file);
  flag_file = local_48;
  *(undefined8 *)(i + last_index + -8) = 0x101ce1;
  fclose(flag_file);
```
It actually opens the flag.txt file in order to write the *original* content of flag.txt *back* into the file.
Actually, I was wrong. It takes whatever is in palatinepackflag.txt and encodes it and then stores it in flag.txt. When I ran the program with an empty palatinepackflag.txt file, I overwrote the flag.txt file and had to re-copy it to the directory. I was correct, though, that decrypting the original contents of flag.txt would produce the correct flag.
Here is my script (with help from ChatGPT):
```python
from typing import ByteString

def flipBits_forward(arr: bytearray) -> None:
    flag = False
    key = 0x69
    for i in range(len(arr)):
        if flag:
            arr[i] = (arr[i] ^ key) & 0xff
            key = (key + 0x20) & 0xff
        else:
            arr[i] = (~arr[i]) & 0xff
        flag = not flag

def flipBits_inverse(transformed: bytearray) -> bytearray:
    n = len(transformed)
    orig = bytearray(n)
    for i in range(n):
        if (i % 2) == 0:
            orig[i] = (~transformed[i]) & 0xff
        else:
            key = (0x69 + 0x20 * (i // 2)) & 0xff
            orig[i] = transformed[i] ^ key
    return orig

def expand_forward(arr: bytearray) -> bytearray:
    size = len(arr)
    out = bytearray(size * 2)
    flag = False
    key = 0x69
    for i in range(size):
        a = arr[i]
        if flag:
            out[i*2]     = ((a & 0xf0) | ((key >> 4) & 0xff)) & 0xff
            out[i*2 + 1] = ((a & 0x0f) | ((key << 4) & 0xff)) & 0xff
        else:
            out[i*2]     = ((a & 0x0f) | ((key << 4) & 0xff)) & 0xff
            out[i*2 + 1] = ((a & 0xf0) | ((key >> 4) & 0xff)) & 0xff
        key = (key * 0x0b) & 0xff
        flag = not flag
    return out

def expand_inverse(expanded: bytearray) -> bytearray:
    assert len(expanded) % 2 == 0
    n = len(expanded) // 2
    out = bytearray(n)
    flag = False
    for i in range(n):
        b0 = expanded[i*2]
        b1 = expanded[i*2 + 1]
        if flag:
            out[i] = ((b0 & 0xf0) | (b1 & 0x0f)) & 0xff
        else:
            out[i] = ((b1 & 0xf0) | (b0 & 0x0f)) & 0xff
        flag = not flag
    return out

def encode_bytes(raw: ByteString) -> bytes:
    buf = bytearray(raw)
    flipBits_forward(buf)
    buf = expand_forward(buf)
    buf = expand_forward(buf)
    buf = expand_forward(buf)
    return bytes(buf)

def decode_bytes(flag_bytes: ByteString) -> bytes:
    buf = bytearray(flag_bytes)
    buf = expand_inverse(buf)
    buf = expand_inverse(buf)
    buf = expand_inverse(buf)
    orig = flipBits_inverse(buf)
    return bytes(orig)

# Example usage on real files:
# with open("palatinepackflag.txt", "rb") as f:
#     raw = f.read()
# enc = encode_bytes(raw)
# with open("flag.txt", "wb") as f:
#     f.write(enc)
#
# To recover:
with open("flag.txt", "rb") as f:
 flag_data = f.read()
recovered = decode_bytes(flag_data)
with open("recovered_flag_input.bin", "wb") as f:
 f.write(recovered)
```
I would like to quickly highlight that I was incorrect in thinking that the anti_debug() function was the only thing that I would need to pass in order to easily obtain the flag. Regardless, I solved the challenge.
# Flag
```bash
sunshine{C3A5ER_CR055ED_TH3_RUB1C0N}
```
