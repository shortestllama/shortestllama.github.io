---
published: true
layout: writeup
title: Intergalactic Copyright Infringement
source: SunshineCTF
category: Forensics
date: 2025-09-28
---
I start by opening the pcapng in wireshark to see what the network traffic could potentially be.
![](/assets/images/writeups/SunshineCTF/Intergalactic_Copyright_Infringement/wireshark_output.png)
It seems to primarily be a bittorrent stream, which I've never dealt with before, so it will be difficult extracting the contents.
With the help of tshark, I reveal crucial information regarding the packet capture to help better understand the challenge and how to solve it.
```bash
tshark -r evidence.pcapng -q -z io,stat,1,"bittorrent.piece.data"
 ** (tshark:179736) 15:45:52.117913 [WSUtil WARNING] ./wsutil/filter_files.c:242 -- read_filter_list(): '/usr/share/wireshark/cfilters' line 1 doesn't have a quoted filter name.
 ** (tshark:179736) 15:45:52.118021 [WSUtil WARNING] ./wsutil/filter_files.c:242 -- read_filter_list(): '/usr/share/wireshark/cfilters' line 2 doesn't have a quoted filter name.

=================================
| IO Statistics                 |
|                               |
| Duration: 14. 46576 secs      |
| Interval:  1 secs             |
|                               |
| Col 1: bittorrent.piece.data  |
|-------------------------------|
|          |1                 | |
| Interval | Frames |  Bytes  | |
|-----------------------------| |
|  0 <>  1 |      0 |       0 | |
|  1 <>  2 |      0 |       0 | |
|  2 <>  3 |      0 |       0 | |
|  3 <>  4 |      0 |       0 | |
|  4 <>  5 |      0 |       0 | |
|  5 <>  6 |      0 |       0 | |
|  6 <>  7 |      0 |       0 | |
|  7 <>  8 |      0 |       0 | |
|  8 <>  9 |     78 |  317600 | |
|  9 <> 10 |    258 | 1574840 | |
| 10 <> 11 |      0 |       0 | |
| 11 <> 12 |      0 |       0 | |
| 12 <> 13 |      0 |       0 | |
| 13 <> 14 |      0 |       0 | |
| 14 <> Dur|      0 |       0 | |
=================================
```
After enumerating the pcap, I determine the fields of the bittorrent:
```bash
tshark -G fields | grep -iE 'bittorrent\.piece'
F       Piece index     bittorrent.piece.index  FT_UINT32       bittorrent      BASE_HEX        0x0
F       Begin offset of piece   bittorrent.piece.begin  FT_UINT32       bittorrent      BASE_HEX        0x0
F       Data in a piece bittorrent.piece.data   FT_BYTES        bittorrent              0x0
F       Piece Length    bittorrent.piece.length FT_UINT32       bittorrent      BASE_HEX        0x0
```
With this, I extract those fields into a csv:
```bash
tshark -r evidence.pcapng \
  -d tcp.port==44487,bittorrent -d tcp.port==6881,bittorrent \
  -Y "bittorrent.piece.data && tcp.stream==3" \
  -T fields -E header=y -E separator=, \
  -e tcp.stream \
  -e bittorrent.piece.index \
  -e bittorrent.piece.begin \
  -e bittorrent.piece.data \
  > pieces.csv
```
This csv gives me exactly what I need to generate a script that will take the raw pieces and reassemble the original bittorrent file:
```python
import csv, binascii
from collections import defaultdict

def parse_int(s):
    s = (s or "").strip()
    return int(s, 16) if s.lower().startswith("0x") else int(s or "0")

groups = defaultdict(list)
with open("pieces.csv", newline="") as f:
    r = csv.DictReader(f)
    for row in r:
        s = row.get("tcp.stream","0").strip()
        idx = parse_int(row.get("bittorrent.piece.index"))
        begin = parse_int(row.get("bittorrent.piece.begin"))
        hx = (row.get("bittorrent.piece.data") or "").replace(":", "").replace(" ", "")
        if not hx: continue
        data = binascii.unhexlify(hx)
        groups[s].append((idx, begin, data))

for s, blocks in groups.items():
    piece_size = {}
    for idx, begin, data in blocks:
        piece_size[idx] = max(piece_size.get(idx, 0), begin + len(data))
    prefix, total = {}, 0
    for i in sorted(piece_size):
        prefix[i] = total
        total += piece_size[i]
    buf = bytearray(total)
    for idx, begin, data in blocks:
        off = prefix[idx] + begin
        buf[off:off+len(data)] = data
    out = f"recovered_stream_{s}.bin"
    with open(out, "wb") as w: w.write(buf)
    print(f"[+] Wrote {out} ({len(buf)} bytes)")
```
The output of running this script, provides me with a pdf file:
```bash
file recovered_stream_3.bin 
recovered_stream_3.bin: PDF document, version 1.6, 484 page(s)
```
Opening this reveals the flag on the second page of the pdf.
![](/assets/images/writeups/SunshineCTF/Intergalactic_Copyright_Infringement/flag.png)
# Flag
```bash
sun{4rggg_sp4c3_p1r4cy}
```
