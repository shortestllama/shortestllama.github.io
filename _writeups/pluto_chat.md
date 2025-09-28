---
published: false
layout: writeup
title: Pluto Chat
source: SunshineCTF
category: Re
date: 2025-09-27
---
The first run of the program reveals that it requests login credentials:
```bash
Login to PlutoChat
Username: admin
Password: password
Could not connect to PlutoChat servers. Try again later!
```
This leads me to examine the binary in ghidra and find that it is stripped :(
After looking around through the binary, I find many many many functions that all provide great detail about the nature of the binary.
Now that I understand the binary better, I try debugging it with gdb and find that connection does not work because of this check in the main function once the socket is created and connect() gets called:
```C
  connection_res = connect(s,&server_info,0x10);
  if (connection_res != 0) {
    puts("Could not connect to PlutoChat servers. Try again later!");
                    /* WARNING: Subroutine does not return */
    exit(0);
  }
```
This shows that the server is not actually necessary for solving the challenge. Thus, I begin examining the pcap with my greater knowledge of the server and am able to better understand the packets that are being sent across.
The challenge description hints towards some type of encryption, which there does seem to be, but I need to do more digging before understanding what it might be.
Ok, finally after much reverse engineering and rewriting things in ghidra, I have discovered that the basic execution flow goes as follows.
```C
  begin_pluto_chat_thread(s);
  encrypt_and_send_login_maybe(s,username,password);
  while (pluto_chat_login_flag == 0) {
    usleep(100000);
  }
  get_command(s);
```
There is no loop, so the user enters their username and password, a thread is created to verify the username and password, then that gets encrypted (*HEAVILY*) and sent across the server. Following that, the user (now logged in) can determine if they would like to send a message or exit. If they decide to send a message, it gets encrypted heavily again and sent to the destination.
If the user does not pass authentication, the program will sleep for 100000 seconds.
Now that I understand this, my next goal is to take the encrypted messages I have from the evidence.pcap file and reverse engineer the encryption routine in order to decode the messages and recover the flag.
![](pluto_chat_messages.png)
The highlighted messages are the only packets that contain encrypted data. My hypothesis is that the first two highlighted messages pertain to the first user, who I'll call Alice, logging in and the third and fourth highlighted messages pertain to the second user, who I'll call Bob. The final four messages seem to be information passed between the two users, so I will guess that is where I'll find the flag. Based on all that, I will create a python script to reverse the encryption routine and decode the messages.
HOLY WOW CHATGPT IS AMAZING!!!
```python
#!/usr/bin/env python3
"""
decrypt_ctf.py — Decrypts the custom XOR/RC4-ish stream from your PCAP.

Pipeline (mirrors the provided C):
  PCAP -> TCP reassembly (best-effort) -> records of:
    [4 bytes random_math_value][4 bytes ciphertext_len][ciphertext bytes...]
  Decrypt each record with key derived from random_math_value via encryption_even_more().
  Parse cleartext as: 0x02, len_cmd, cmd, len_msg, msg  (both len_* are 1 byte)
  Prints ASCII results; optionally writes JSON/raw.

Usage:
  python3 decrypt_ctf.py /path/to/evidence.pcap [--flow FILTER] [--json out.json]

FILTER (optional):
  "flow" is a substring match applied to "SRC:SPORT -> DST:DPORT" like "10.0.0.1:4444 -> 10.0.0.2:80"
  Provide any substring to restrict which flows to process.

Notes:
  - Requires `dpkt` (pure Python). If not installed: pip install dpkt
  - Reassembly here is simple-concatenate per TCP stream order. Works for in-order captures;
    if you have heavy reordering/dup acks, you may want to export per-stream payloads via tshark and feed those in.
"""

import sys, struct, json, argparse
from typing import List, Tuple, Dict, Optional

# -------------------- Const tables copied from your binary --------------------

DAT_00104100 = bytes([
    0x0d,0x08,0x11,0x0c,0x0e,0x07,0x00,0x05,0x09,0x04,0x0b,0x10,0x06,0x12,0x0a,0x01,0x02,0x03,0x0f,0x13
])

DAT_00104120 = bytes([
    0xba,0x79,0xce,0x55,0x64,0x13,0x62,0x21,0xbf,0xcc,0x96,0x0f,0x68,0x95,0x2d,0x51,
    0x7a,0x59,0xf6,0x44,0xe5,0x43,0x3e,0xb3,0xa3,0x81,0x4f,0xa6,0x36,0xfb,0x6d,0xf8,
    0xf7,0x1f,0x6b,0x42,0xa7,0xb7,0xbc,0x71,0x0d,0xb4,0xe0,0xb9,0x25,0x0a,0x28,0xa1,
    0x76,0x86,0x6c,0x27,0xd9,0x2a,0x6a,0x03,0xf1,0x72,0xdb,0x54,0x82,0x6f,0xbb,0x1c,
    0x5a,0x38,0xd2,0xbe,0x09,0x9b,0x15,0xb8,0x8f,0x78,0x4c,0x34,0x67,0xd7,0xab,0x75,
    0x45,0x87,0x9d,0x10,0xe8,0xeb,0x32,0x8d,0xc5,0x46,0x65,0x0b,0x35,0xbd,0xea,0x06,
    0xa5,0xdd,0xa4,0x5f,0x40,0x5d,0xfc,0x9a,0x5b,0xcb,0x89,0x91,0x5c,0xfe,0x66,0xfd,
    0xaa,0x37,0x02,0x12,0x98,0x6e,0x17,0xc9,0x50,0x20,0x39,0xc2,0xed,0xe7,0xb2,0x74,
    0xe2,0xef,0x16,0x5e,0x99,0x47,0xf5,0x1e,0x23,0x01,0x57,0xa0,0x3b,0x1b,0x2b,0xee,
    0xc1,0x58,0x9e,0xa9,0xca,0xff,0xc4,0x7b,0x4b,0x8e,0x48,0xcd,0x7c,0xc0,0x56,0xd0,
    0x33,0xc7,0x70,0x8b,0xe1,0x8c,0xc3,0x0e,0x1d,0x3d,0xda,0xcf,0x11,0x73,0xec,0xc6,
    0x92,0xb6,0x26,0x05,0xfa,0xf0,0xe6,0x0c,0x14,0x69,0x61,0xc8,0x60,0x31,0x9c,0x22,
    0xac,0x9f,0x4e,0x49,0x29,0x3f,0x85,0xf3,0x53,0xf9,0x63,0xdf,0xd3,0xf2,0x00,0x2e,
    0x18,0xd1,0xde,0x8a,0x52,0x08,0xe9,0xa2,0xe4,0x3a,0x83,0x7f,0x94,0xb5,0xd4,0xd5,
    0x77,0x07,0xdc,0x19,0x84,0xd8,0xaf,0xa8,0x93,0x7e,0xd6,0x2c,0xf4,0x41,0xb1,0x2f,
    0x7d,0x4d,0x97,0x1a,0x3c,0xb0,0x80,0x90,0x4a,0xae,0x24,0x88,0xad,0x04,0x30,0xe3
])

# -------------------- Crypto core (Python re-implementation) --------------------

def rol32(x: int, r: int) -> int:
    r &= 31
    return ((x << r) & 0xFFFFFFFF) | ((x & 0xFFFFFFFF) >> (32 - r))

def bitwise_encryption(math_val: int, math_val_f: int) -> int:
    return rol32(math_val, math_val_f & 0x1F)

def derive_key_bytes_from_seed(seed: int) -> bytes:
    """Implements encryption_even_more(key, seed) *only* up to producing the 0x50-byte password.
       Returns the 0x50 bytes used by the KSA (encryption_more)."""
    # Build 20 dwords
    words = []
    math_val = seed & 0xFFFFFFFF
    for _ in range(0x14):
        words.append(math_val)
        math_val = bitwise_encryption(math_val, math_val & 0xF)

    # Permute 20 dwords by DAT_00104100
    perm = list(words)
    for j in range(0x14):
        a = j
        b = DAT_00104100[j]
        perm[a], perm[b] = perm[b], perm[a]

    # Byte transform via DAT_00104120 with rolling XOR by previous byte (xor_key).
    # The original decompile used an uninitialized xor_key; we'll default to 0 (typical for such puzzles).
    out = bytearray(0x50)
    xor_key = 0
    # Flatten perm dwords into 80 bytes little-endian (C on x86 is little by default).
    raw = b''.join(struct.pack('<I', w) for w in perm)
    assert len(raw) == 0x50
    for k in range(0x50):
        mapped = DAT_00104120[ raw[k] ]
        out[k] = mapped ^ xor_key
        xor_key = out[k]
    return bytes(out)

class RC4ish:
    """KSA/PRGA as defined by encryption_more + encryption_based_on_rand_math_val_and_len."""
    def __init__(self, password: bytes):
        # dest[0]=0, dest[1]=0, S at dest[2:258] initialized to 0..255
        self.i = 0  # key[0]
        self.j = 0  # key[1]
        self.S = list(range(256))
        # KSA: for j in 0..255: num = password[j % len] + num + S[j]; swap S[j], S[num]
        num = 0
        plen = len(password)
        for j in range(256):
            num = ( (password[j % plen] + num + self.S[j]) & 0xFF )
            self.S[j], self.S[num] = self.S[num], self.S[j]

    def keystream_byte(self) -> int:
        # PRGA:
        # i = i + 1
        # j = j + S[i]
        # swap S[i], S[j]
        # out = S[ S[j] + S[i] ]
        self.i = (self.i + 1) & 0xFF
        self.j = (self.j + self.S[self.i]) & 0xFF
        self.S[self.i], self.S[self.j] = self.S[self.j], self.S[self.i]
        t = (self.S[self.j] + self.S[self.i]) & 0xFF
        return self.S[t]

    def apply(self, data: bytes) -> bytes:
        return bytes( (b ^ self.keystream_byte()) for b in data )

def decrypt_blob(seed: int, ciphertext: bytes) -> bytes:
    pwd = derive_key_bytes_from_seed(seed)
    rc4 = RC4ish(pwd)
    return rc4.apply(ciphertext)

# -------------------- Record parsing --------------------

def parse_and_maybe_decrypt_records(payload: bytes) -> List[Tuple[int,int,bytes]]:
    """Given a raw TCP bytestream payload (possibly concatenated records), extract records:
       [(seed, length, ciphertext_bytes), ...]
       Tries both little-endian and big-endian for length sanity check.
    """
    recs = []
    cursor = 0
    n = len(payload)
    # Heuristic: records are well-aligned; if something looks off, move by 1 and try again.
    while cursor + 8 <= n:
        seed_le, n_le = struct.unpack_from('<II', payload, cursor)
        seed_be, n_be = struct.unpack_from('>II', payload, cursor)
        # Choose len that seems plausible
        chosen = None
        for seed, ln, endian in ((seed_le, n_le, '<'), (seed_be, n_be, '>')):
            if 0 < ln <= 65536 and cursor + 8 + ln <= n:
                chosen = (seed, ln, endian); break
        if not chosen:
            # Not a header here; advance by 1 to resync
            cursor += 1
            continue
        seed, ln, endian = chosen
        ctext = payload[cursor+8:cursor+8+ln]
        recs.append((seed, ln, ctext))
        cursor += 8 + ln
    return recs

def parse_clear_message(clear: bytes) -> Optional[Tuple[str,str]]:
    """Parses [0x02][len_cmd][cmd][len_msg][msg]. Returns (cmd, msg) if valid and ASCII-ish."""
    if len(clear) < 3: return None
    if clear[0] != 0x02: return None
    lc = clear[1]
    if 2 + lc >= len(clear): return None
    cmd = clear[2:2+lc]
    lm = clear[2+lc]
    start = 3 + lc
    end = start + lm
    if end > len(clear): return None
    msg = clear[start:end]
    try:
        return (cmd.decode('utf-8', 'replace'), msg.decode('utf-8', 'replace'))
    except Exception:
        return (cmd.decode('latin1', 'replace'), msg.decode('latin1', 'replace'))

# -------------------- PCAP reading & TCP reassembly --------------------

def read_pcap_tcp_streams(pcap_path: str, flow_filter_substr: Optional[str] = None
                         ) -> Dict[Tuple[str,int,str,int], bytes]:
    """Return map: (src, sport, dst, dport) -> concatenated TCP payload (client->server direction only).
       Uses dpkt to iterate packets; best-effort concatenation in capture order.
    """
    try:
        import dpkt, socket
    except Exception as e:
        print("ERROR: This script requires the 'dpkt' package to parse PCAP files.\n"
              "Install it via:  pip install dpkt\n"
              f"Import error: {e}", file=sys.stderr)
        sys.exit(2)

    streams: Dict[Tuple[str,int,str,int], bytearray] = {}
    with open(pcap_path, 'rb') as f:
        pcap = None
        # Detect pcap vs pcapng
        magic = f.read(4)
        f.seek(0)
        if magic in (b'\xd4\xc3\xb2\xa1', b'\xa1\xb2\xc3\xd4', b'\x4d\x3c\xb2\xa1', b'\xa1\xb2\x3c\x4d'):
            # PCAP
            pcap = dpkt.pcap.Reader(f)
            def iter_pkts():
                for ts, buf in pcap:
                    yield ts, buf
        else:
            # PCAPNG
            pcapng = dpkt.pcapng.Reader(f)
            def iter_pkts():
                for ts, buf in pcapng:
                    yield ts, buf

        for ts, buf in iter_pkts():
            try:
                eth = dpkt.ethernet.Ethernet(buf)
                ip = eth.data
                if isinstance(ip, dpkt.ip.IP):
                    tcp = ip.data
                elif isinstance(ip, dpkt.ip6.IP6):
                    tcp = ip.data
                else:
                    continue
                if not isinstance(tcp, dpkt.tcp.TCP): 
                    continue
                if len(tcp.data) == 0:
                    continue
                src = socket.inet_ntop(socket.AF_INET6 if isinstance(ip, dpkt.ip6.IP6) else socket.AF_INET, ip.src)
                dst = socket.inet_ntop(socket.AF_INET6 if isinstance(ip, dpkt.ip6.IP6) else socket.AF_INET, ip.dst)
                flow = f"{src}:{tcp.sport} -> {dst}:{tcp.dport}"
                if flow_filter_substr and flow_filter_substr not in flow:
                    continue
                key = (src, tcp.sport, dst, tcp.dport)
                streams.setdefault(key, bytearray()).extend(tcp.data)
            except Exception:
                # Skip malformed packets quietly
                continue

    return {k: bytes(v) for k, v in streams.items()}

# -------------------- Main --------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pcap", help="Path to evidence.pcap / .pcapng")
    ap.add_argument("--flow", help="Substring filter applied to 'SRC:SPORT -> DST:DPORT'")
    ap.add_argument("--json", help="Write JSON results to this path")
    ap.add_argument("--dump-raw", action="store_true", help="Also write raw decrypted blobs to files")
    args = ap.parse_args()

    streams = read_pcap_tcp_streams(args.pcap, args.flow)
    if not streams:
        print("No TCP payloads found (or filter excluded everything).")
        return

    results = []
    for (src,sp,dst,dp), payload in streams.items():
        flow = f"{src}:{sp} -> {dst}:{dp}"
        records = parse_and_maybe_decrypt_records(payload)
        if not records:
            continue
        print(f"\n=== Flow: {flow} | {len(records)} candidate records ===")
        for idx, (seed, ln, ctext) in enumerate(records):
            # Try decrypt
            ptxt = decrypt_blob(seed, ctext)
            parsed = parse_clear_message(ptxt)
            # Heuristic: keep only if the message structure looks valid and bytes are printable-ish
            if parsed is None:
                # Some records might actually be something else; show hex preview
                print(f"  [!] Record {idx}: seed=0x{seed:08x} len={ln} -> structure mismatch; showing first 32 bytes: {ptxt[:32].hex()}")
                continue
            cmd, msg = parsed
            print(f"  [{idx}] seed=0x{seed:08x} len={ln}")
            print(f"       command: {cmd!r}")
            print(f"       message: {msg!r}")
            results.append({
                "flow": flow,
                "index": idx,
                "seed": seed,
                "length": ln,
                "command": cmd,
                "message": msg
            })
            if args.dump_raw:
                with open(f"decrypted_{sp}_{dp}_{idx}.bin", "wb") as wf:
                    wf.write(ptxt)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as jf:
            json.dump(results, jf, ensure_ascii=False, indent=2)
        print(f"\nWrote JSON to {args.json}")

if __name__ == "__main__":
    main()
```
Output:
```bash

=== Flow: 127.0.0.1:51566 -> 127.0.0.1:31337 | 2 candidate records ===
  [!] Record 0: seed=0x777f23c6 len=32 -> structure mismatch; showing first 32 bytes: 0011746f70736563726574656e67696e6565720c506c75746f4d617273323321
  [1] seed=0x7ffec87f len=72
       command: 'givemethemoney'
       message: "Of course! It's: sun{S3cur1ty_thr0ugh_Obscur1ty_1s_B4D}"

=== Flow: 127.0.0.1:31337 -> 127.0.0.1:51566 | 2 candidate records ===
  [!] Record 0: seed=0x5e966159 len=1 -> structure mismatch; showing first 32 bytes: 01
  [!] Record 1: seed=0x7d2fa743 len=79 -> structure mismatch; showing first 32 bytes: 030e676976656d657468656d6f6e65793e4865792063616e20796f7520676976

=== Flow: 127.0.0.1:60574 -> 127.0.0.1:31337 | 2 candidate records ===
  [!] Record 0: seed=0x777f23c6 len=30 -> structure mismatch; showing first 32 bytes: 000e676976656d657468656d6f6e65790d53656c6c757264617461313221
  [1] seed=0xf7fff9e1 len=82
       command: 'topsecretengineer'
       message: 'Hey can you give me that sensitive key you were talking about?'

=== Flow: 127.0.0.1:31337 -> 127.0.0.1:60574 | 2 candidate records ===
  [!] Record 0: seed=0x1304400e len=1 -> structure mismatch; showing first 32 bytes: 01
  [!] Record 1: seed=0xe4a55f9b len=75 -> structure mismatch; showing first 32 bytes: 0311746f70736563726574656e67696e656572374f6620636f75727365212049
```
Note: the structure mismatch records are likely the login encryption messages because I didn't include those in my script - just the message encryption functions.
# Flag
```bash
sun{S3cur1ty_thr0ugh_Obscur1ty_1s_B4D}
```
