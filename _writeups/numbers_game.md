---
layout: writeup
title: Numbers Game
source: SunshineCTF
category: Re
date: 2025-09-27
---
Opening the challenge in ghidra reveals the goal of the challenge to be very simple:
```C
undefined8 main(void)

{
  int rand_1;
  int rand_2;
  int rand_3;
  time_t tVar1;
  char *fgets_success;
  char input [256];
  ulong input_num;
  ulong secret;
  
  puts(
      "Let\'s make a deal! If you can guess the number of fingers I am holding up behind my back, I\ 'll let you have my flag.\x1b[0m"
      );
  puts("\x1b[4mHint: I am polydactyl and have 18,466,744,073,709,551,615 fingers.\x1b[0m");
  secret = 0;
  tVar1 = time((time_t *)0x0);
  srand((uint)tVar1);
  rand_1 = rand();
  rand_2 = rand();
  rand_3 = rand();
  secret = (long)rand_3 << 0x3e | (long)rand_1 | (long)rand_2 << 0x1f;
  fgets_success = fgets(input,256,stdin);
  if (fgets_success == (char *)0x0) {
    puts("\x1b[31mError with input.\x1b[0m");
  }
  __isoc99_sscanf(input,"%llu",&input_num);
  if (secret == input_num) {
    system("cat flag.txt");
  }
  else {
    puts("\x1b[31mWRONG!!! Maybe next time?\x1b[0m");
  }
  return 0;
}
```
Definitely not easy though, just very clear where the solution lies.
Trying it in gdb first to see what happens:
![](manual_solve.png)
Re-examining the disassembly, the input is compared against some random type of value, however, it has a set seed based on the call to time(). Because of this, the comparison value can be dynamically calculated, leading to the binary being exploited.
After writing a script to replicate the logic and testing it over and over again, I discovered one final obstacle to overcome in the form of 2's complement:
![](2s_complement.png)
Finally, the code works:
```python
from pwn import *

# reproduce_secret.py
from ctypes import CDLL, c_uint, c_int
import time
import sys

# Load libc (Linux). Change if your libc path is different.
libc = CDLL("libc.so.6")
libc.srand.argtypes = [c_uint]
libc.rand.restype = c_int

MASK64 = (1 << 64) - 1

def _sign_extend_32_to_64_bitpattern(x):
    """
    Given a 32-bit value returned by c_int (which may be negative),
    produce the 64-bit two's-complement bit pattern that the assembly's
    MOVSXD/CDQE would create.
    """
    x32 = x & 0xFFFFFFFF
    if x32 & (1 << 31):
        s = x32 - (1 << 32)   # signed Python int (negative)
    else:
        s = x32
    return s & MASK64

def secret_for_seed(seed):
    # seed exactly like C: srand((unsigned) seed)
    libc.srand(c_uint(seed))
    r1 = libc.rand()
    r2 = libc.rand()
    r3 = libc.rand()

    # emulate assembly:
    #   MOVSXD RBX, EAX  -> sign-extend r1 into 64-bit bitpattern
    #   CDQE; SHL RAX,31 -> sign-extend r2 then shift left 31
    #   OR RBX,RAX
    #   CDQE; SHL RAX,62 -> sign-extend r3 then shift left 62
    #   OR RAX,RBX -> final 64-bit secret
    a = _sign_extend_32_to_64_bitpattern(r1)
    b = _sign_extend_32_to_64_bitpattern(r2)
    c = _sign_extend_32_to_64_bitpattern(r3)

    b_shifted = (b << 31) & MASK64
    c_shifted = (c << 62) & MASK64

    rbx = (a | b_shifted) & MASK64
    rax = (c_shifted | rbx) & MASK64

    secret = rax
    return r1, r2, r3, secret

def main():
    context.terminal = ['tmux', 'splitw', '-h', '-p', '50']   # right half, 50% width

    p = process("./numbers-game")

    # same as time(NULL)
    t = time.time()
    seed = int(t)
    r1, r2, r3, secret = secret_for_seed(seed)
    print("time:", t)
    print("seed:", seed)
    print("r1:", r1)
    print("r2:", r2)
    print("r3:", r3)
    print("secret:", secret)
    print("secret (i64):", secret if secret < (1<<63) else secret - (1<<64))
    
    '''
    gdb.attach(p, """
    b *main+66
    b *main+107
    r
    """)
    '''

    p.sendline(str(secret))

    try:
        while True:
            out = p.recvline()

            if not out:
                break

            print(out)

    except EOFError:
        # process closed — print whatever is left in the buffer
        remaining = p.recvall(timeout=1) or b''
        if remaining:
            print(remaining)

    #p.interactive()

if __name__ == "__main__":
    main()
```
Here is the output locally - note the FLAG coming from my own flag.txt file:
```bash
[+] Starting local process './numbers-game': pid 122841
time: 1759008888.9064476
seed: 1759008888
r1: 1923279299
r2: 698666305
r3: 1508261438
secret: 10723746504174135747
secret (i64): -7722997569535415869
/home/kali/Documents/SunshineCTF/Re/Numbers_Game/new.py:81: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  p.sendline(str(secret))
b"Let's make a deal! If you can guess the number of fingers I am holding up behind my back, I'll let you have my flag.\x1b[0m\n"
b'\x1b[4mHint: I am polydactyl and have 18,466,744,073,709,551,615 fingers.\x1b[0m\n'
b'FLAG\n'
[+] Receiving all data: Done (0B)
[*] Process './numbers-game' stopped with exit code 0 (pid 122841)
```
Modifying the script for the remote target:
```python
from pwn import *

# reproduce_secret.py
from ctypes import CDLL, c_uint, c_int
import time
import sys

# Load libc (Linux). Change if your libc path is different.
libc = CDLL("libc.so.6")
libc.srand.argtypes = [c_uint]
libc.rand.restype = c_int

MASK64 = (1 << 64) - 1

def _sign_extend_32_to_64_bitpattern(x):
    """
    Given a 32-bit value returned by c_int (which may be negative),
    produce the 64-bit two's-complement bit pattern that the assembly's
    MOVSXD/CDQE would create.
    """
    x32 = x & 0xFFFFFFFF
    if x32 & (1 << 31):
        s = x32 - (1 << 32)   # signed Python int (negative)
    else:
        s = x32
    return s & MASK64

def secret_for_seed(seed):
    # seed exactly like C: srand((unsigned) seed)
    libc.srand(c_uint(seed))
    r1 = libc.rand()
    r2 = libc.rand()
    r3 = libc.rand()

    # emulate assembly:
    #   MOVSXD RBX, EAX  -> sign-extend r1 into 64-bit bitpattern
    #   CDQE; SHL RAX,31 -> sign-extend r2 then shift left 31
    #   OR RBX,RAX
    #   CDQE; SHL RAX,62 -> sign-extend r3 then shift left 62
    #   OR RAX,RBX -> final 64-bit secret
    a = _sign_extend_32_to_64_bitpattern(r1)
    b = _sign_extend_32_to_64_bitpattern(r2)
    c = _sign_extend_32_to_64_bitpattern(r3)

    b_shifted = (b << 31) & MASK64
    c_shifted = (c << 62) & MASK64

    rbx = (a | b_shifted) & MASK64
    rax = (c_shifted | rbx) & MASK64

    secret = rax
    return r1, r2, r3, secret

def main():
    context.terminal = ['tmux', 'splitw', '-h', '-p', '50']   # right half, 50% width

    #p = process("./numbers-game")
    p = remote("chal.sunshinectf.games", 25101)

    # same as time(NULL)
    t = time.time()
    seed = int(t)
    r1, r2, r3, secret = secret_for_seed(seed)
    print("time:", t)
    print("seed:", seed)
    print("r1:", r1)
    print("r2:", r2)
    print("r3:", r3)
    print("secret:", secret)
    print("secret (i64):", secret if secret < (1<<63) else secret - (1<<64))
    
    '''
    gdb.attach(p, """
    b *main+66
    b *main+107
    r
    """)
    '''

    p.sendline(str(secret))

    try:
        while True:
            out = p.recvline()

            if not out:
                break

            print(out)

    except EOFError:
        # process closed — print whatever is left in the buffer
        remaining = p.recvall(timeout=1) or b''
        if remaining:
            print(remaining)

    #p.interactive()

if __name__ == "__main__":
    main()
```
Yields not so great results:
```bash
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
time: 1759008947.0262938
seed: 1759008947
r1: 1161252436
r2: 425323983
r3: 132825836
secret: 913376299755982420
secret (i64): 913376299755982420
/home/kali/Documents/SunshineCTF/Re/Numbers_Game/new.py:81: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  p.sendline(str(secret))
b"Let's make a deal! If you can guess the number of fingers I am holding up behind my back, I'll let you have my flag.\x1b[0m\n"
b'\x1b[4mHint: I am polydactyl and have 18,466,744,073,709,551,615 fingers.\x1b[0m\n'
b'\x1b[31mWRONG!!! Maybe next time?\x1b[0m\n'
[+] Receiving all data: Done (0B)
[*] Closed connection to chal.sunshinectf.games port 25101
```
My hypothesis is that there is a difference in timing. I will try to debug with gdb to see if I can verify this issue.
Nvm... obviously that does not work, otherwise, the challenge would be way too easy:
```bash
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
time: 1759009102.1904788
seed: 1759009102
r1: 1264843403
r2: 480269864
r3: 2082288898
secret: 10254743717686803083
secret (i64): -8192000356022748533
[ERROR] Could not find remote process (35.224.96.30:25101) on this machine
Traceback (most recent call last):
  File "/home/kali/Documents/SunshineCTF/Re/Numbers_Game/new.py", line 101, in <module>
    main()
    ~~~~^^
  File "/home/kali/Documents/SunshineCTF/Re/Numbers_Game/new.py", line 73, in main
    gdb.attach(p, """
    ~~~~~~~~~~^^^^^^^
    b *main+66
    ^^^^^^^^^^
    b *main+107
    ^^^^^^^^^^^
    r
    ^
    """)
    ^^^^
  File "/home/kali/pwntools-env/lib/python3.13/site-packages/pwnlib/context/__init__.py", line 1690, in setter
    return function(*a, **kw)
  File "/home/kali/pwntools-env/lib/python3.13/site-packages/pwnlib/gdb.py", line 1130, in attach
    log.error('Could not find remote process (%s:%d) on this machine' %
    ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              target.sock.getpeername())
              ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/kali/pwntools-env/lib/python3.13/site-packages/pwnlib/log.py", line 439, in error
    raise PwnlibException(message % args)
pwnlib.exception.PwnlibException: Could not find remote process (35.224.96.30:25101) on this machine
[*] Closed connection to chal.sunshinectf.games port 25101
```
FINALLY!
This next thought I had was to brute force seeds by using a time range because each connection takes less than a second, so I can increase my time by one second rather than having to guess the exact second of the seed. Here is the code:
```python
from ctypes import CDLL, c_uint, c_int
import time
from pwn import remote
import re

HOST = "chal.sunshinectf.games"
PORT = 25101

# how many seconds before/after `now` to try
WINDOW = 120   # try seeds now-WINDOW .. now+WINDOW
RECV_TIMEOUT = 2

# libc (change if remote libc differs; or point to provided libc file)
libc = CDLL("libc.so.6")
libc.srand.argtypes = [c_uint]
libc.rand.restype = c_int

MASK64 = (1 << 64) - 1
FLAG_RE = re.compile(r"(?i)(sun\{[^}]{1,200}\})")  # case-insensitive, up to 200 chars inside braces

def _sign_extend_32_to_64_bitpattern(x):
    x32 = x & 0xFFFFFFFF
    if x32 & (1 << 31):
        s = x32 - (1 << 32)
    else:
        s = x32
    return s & MASK64

def secret_for_seed(seed):
    libc.srand(c_uint(seed))
    r1 = libc.rand()
    r2 = libc.rand()
    r3 = libc.rand()
    a = _sign_extend_32_to_64_bitpattern(r1)
    b = _sign_extend_32_to_64_bitpattern(r2)
    c = _sign_extend_32_to_64_bitpattern(r3)
    b_shifted = (b << 31) & MASK64
    c_shifted = (c << 62) & MASK64
    rbx = (a | b_shifted) & MASK64
    rax = (c_shifted | rbx) & MASK64
    return r1, r2, r3, rax

def signed_i64_from_u64(u):
    return u if u < (1<<63) else u - (1<<64)

def try_seed_once_signed(seed):
    """Open new connection, send signed-decimal payload only, return (ok, reply_text, debug_info)."""
    r1, r2, r3, secret_u64 = secret_for_seed(seed)
    signed = signed_i64_from_u64(secret_u64)
    payload = str(signed).encode()

    try:
        p = remote(HOST, PORT, timeout=5)
    except Exception as e:
        return False, "", f"connect error: {e}", (r1, r2, r3, secret_u64)

    data = b""
    try:
        # read any initial banner quickly
        try:
            banner = p.recvuntil(b"\n", timeout=0.5)
            data += banner
            while True:
                more = p.recvline(timeout=0.1)
                if not more:
                    break
                data += more
        except Exception:
            pass

        # send only the signed decimal payload once
        p.sendline(payload)

        # read remaining output (short timeout)
        try:
            data += p.recvall(timeout=RECV_TIMEOUT) or b""
        except Exception:
            # fallback to reading lines
            try:
                while True:
                    line = p.recvline(timeout=0.5)
                    if not line:
                        break
                    data += line
            except Exception:
                pass

    finally:
        try:
            p.close()
        except Exception:
            pass

    txt = data.decode(errors="ignore")
    m = FLAG_RE.search(txt)
    if m:
        return True, txt, m.group(1), (r1, r2, r3, secret_u64)
    return False, txt, None, (r1, r2, r3, secret_u64)

def main():
    now = int(time.time())
    start = now # - WINDOW
    end = now + WINDOW
    print(f"[+] Bruteforcing seeds {start} .. {end} (now={now}) — signed decimal only")
    for seed in range(start, end + 1):
        ok, txt, flag_match, info = try_seed_once_signed(seed)
        r1, r2, r3, secret_u64 = info
        if ok:
            print(f"[+] FOUND FLAG with seed {seed}!")
            print("r1, r2, r3:", r1, r2, r3)
            print("secret_u64:", secret_u64)
            print("matched flag:", flag_match)
            print("full reply:\n")
            print(txt)
            return
        else:
            # concise progress line (you can comment this out to be quieter)
            print(f"[seed {seed}] no flag (r1={r1} r2={r2} r3={r3} secret={secret_u64})")

    print("[+] Done. No flag found in window. Try increasing WINDOW or verify libc/format.")

if __name__ == "__main__":
    main()
```
And here is the final solution output:
```bash
[+] Bruteforcing seeds 1759009895 .. 1759010015 (now=1759009895) — signed decimal only
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009895] no flag (r1=614623028 r2=634371667 r3=1016283765 secret=5973988800679012148)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009896] no flag (r1=1381791728 r2=446708917 r3=593273143 secret=14794358151337244656)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009897] no flag (r1=1068698850 r2=250593498 r3=1231101268 secret=538145440318819554)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009898] no flag (r1=1844783697 r2=69605932 r3=815451212 secret=149477602618583633)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009899] no flag (r1=1547160419 r2=2037187346 r3=1471607491 secret=18209884570276842339)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009900] no flag (r1=1237161284 r2=1843048513 r3=1038986886 secret=13181288582230152516)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009901] no flag (r1=929473036 r2=1655398768 r3=1686331237 secret=8166627804556206604)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009902] no flag (r1=627582863 r2=1470521558 r3=190890793 secret=7769607018891454351)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (35B)
[*] Closed connection to chal.sunshinectf.games port 25101
[seed 1759009903] no flag (r1=320725850 r2=204546093 r3=835810045 secret=5050945408727901018)
[+] Opening connection to chal.sunshinectf.games on port 25101: Done
[+] Receiving all data: Done (42B)
[*] Closed connection to chal.sunshinectf.games port 25101
[+] FOUND FLAG with seed 1759009904!
r1, r2, r3: 22729545 1100742966 1496493250
secret_u64: 11587199557013525321
matched flag: sun{I_KNOW_YOU_PLACED_A_MIRROR_BEHIND_ME}
full reply:

Let's make a deal! If you can guess the number of fingers I am holding up behind my back, I'll let you have my flag.
Hint: I am polydactyl and have 18,466,744,073,709,551,615 fingers.
sun{I_KNOW_YOU_PLACED_A_MIRROR_BEHIND_ME}
```
# Flag
```bash
sun{I_KNOW_YOU_PLACED_A_MIRROR_BEHIND_ME}
```
