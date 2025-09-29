---
published: true
layout: writeup
title: Roman Romance
source: SunshineCTF
category: Re
date: 2025-09-28
---
I start by running it, as per usual:
```bash
zsh: segmentation fault  ./romanromance
```
This one is interesting - I rarely see a segfault right in the beginning.
Opening the enc.txt file, though, it appears the binary will be performing some encryption/decryption:
```bash
tvotijof|lO1x`z1v5`s1nAo`iJ6u1sZ~
```
Maybe supplying the enc.txt file as input will get rid of the segfault...
It did not.
I will try examining it in ghidra now.
There it is:
```C
pFVar1 = fopen("flag.txt","r+b");
```
I need to make a flag.txt file.
```bash
sunshine{FLAG}
```
The challenge information has a note that the challenge has a non-standard "sunshine{}" flag format.
That worked, but had some adverse effects:
```bash




⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣴⠶⠾⠿⠛⠛⠻⠿⠶⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⣾⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣷⣄⠀⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⢠⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣆⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⣿⠇⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡈⣿⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⣿⡆⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠁⣿⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⠸⣧⢸⡆⢀⣀⣀⣤⡀⠀⠀⢀⣤⣀⣀⡀⠀⡟⣸⡟⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⠀⠹⣿⠁⣿⣿⣿⣿⡟⠀⠀⠸⣿⣿⣿⣿⠆⣿⠟⠀⠀⠀⣀⠀⠀                                                                                                                                                                                                              
⠀⢰⡟⢿⣆⠀⠀⣿⠀⠙⢿⣿⠟⠀⣠⣄⠀⠹⣿⣿⠟⠀⢹⠀⠀⣠⡿⢻⣇⠀                                                                                                                                                                                                              
⣠⡾⠃⠈⠻⢷⣦⣽⣄⡀⠀⠀⠀⢸⣿⣿⣧⠀⠀⠀⢀⣠⣿⣤⡶⠟⠁⠘⢿⣆                                                                                                                                                                                                              
⠻⠷⠶⠶⣶⣤⣈⠙⠻⣿⣷⣦⠀⠸⠋⠙⠟⠀⣠⣾⣿⠟⠋⣁⣠⣴⠶⠶⠾⠟                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⠉⠛⠿⣶⣼⠿⣿⣲⡤⡤⡤⢤⢰⣿⡏⣿⣶⠿⠛⠉⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⠀⠀⠀⠀⢀⣠⣴⣿⡄⠻⣹⡟⡟⡟⣻⣻⠽⠁⣿⣦⣄⡀⠀⠀⠀⠀⠀⠀                                                                                                                                                                                                              
⠀⠀⣶⠾⠶⠾⠟⠋⣁⣼⣷⡀⠀⠉⠉⠉⠉⠀⢀⣼⣧⣀⠉⠛⠷⠶⠿⣶⡄⠀                                                                                                                                                                                                              
⠀⠀⠙⣷⡄⢀⣴⠿⠛⠁⠀⠙⠳⠶⠤⠴⠶⠞⠋⠀⠈⠙⠻⣶⡄⠀⣾⠟⠁⠀                                                                                                                                                                                                              
⠀⠀⠀⢸⣷⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣶⡿⠀⠀⠀                                                                                                                                                                                                              
                                                                                                                                                                                                                                            



/*************************************************************************************\ 

  MWAHAAHAHAH SAY GOOD-BYTE TO YOUR FLAG ROMAN FILTH!!!!! >:) 
  OUR ENCRYPTION METHOD IS TOO STRONG TO BREAK. YOU HAVE TO PAY US >:D 
  PAY 18.BTC TO THE ADDRESS 1BEER4MINERSMAKEITRAINCOINSHUNT123 TO GET YOUR FLAG BACK,  
  OR WE SACK ROME AND I TAKE HONORIA'S HAND IN MARRIAGE! SIGNED, ATTILA THE HUN.  

/*************************************************************************************\
```
enc.txt now contains:
```bash
tvotijof|GMBH~
```
Not ideal, but based on the wrapper, we gain some information. 'tvotijof|' is equivalent to 'sunshine{' and '~' is equivalent to '}'. It seems like it could be a caesar cipher, but I'll have to do more ghidra analysis to confirm.
Yeah, it's actually a really simple Caesar cipher:
```C
      for (i = 0; i < (long)file_size; i = i + 1) {
        *(char *)((long)addr + i) = *(char *)((long)addr + i) + '\x01';
      }
```
Every byte gets 0x01 added to it. All I have to do to get the flag now is subtract 0x01 from each byte in the original enc.txt file.
Instead of doing things manually, I decided to write a script:
```python
import argparse

def process_file(filename, hex_offset):
    with open(filename, "rb") as f:
        data = f.read()

    result_bytes = bytearray()
    for byte in data:
        new_byte = (byte - hex_offset) % 256  # wrap around if needed
        result_bytes.append(new_byte)

    try:
        print(result_bytes.decode('ascii'))
    except UnicodeDecodeError:
        print("[!] Resulting bytes could not be fully decoded as ASCII.")
        print(result_bytes)

def main():
    parser = argparse.ArgumentParser(description="Subtract hex value from each byte of an ASCII file.")
    parser.add_argument("file", help="Path to ASCII text file")
    parser.add_argument("hexval", help="Hex value to subtract (e.g., 0x01)")
    args = parser.parse_args()

    try:
        hex_offset = int(args.hexval, 16)
        if not (0 <= hex_offset <= 255):
            raise ValueError
    except ValueError:
        print("[-] Error: Hex value must be a valid number between 0x00 and 0xFF.")
        return

    process_file(args.file, hex_offset)

if __name__ == "__main__":
    main()
```
It worked!
# Flag
```bash
sunshine{kN0w_y0u4_r0m@n_hI5t0rY}
```
