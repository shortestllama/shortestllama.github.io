---
published: true
layout: writeup
title: Pretty Delicious Food
source: SunshineCTF
category: Forensics
date: 2025-09-28
---
The file is, surprisingly, a pdf and yet the challenge description says no steg. I immediately think to try exiftool, but I'm not sure if the challenge creator classifies that as steg. I try it anyway...
```bash
ExifTool Version Number         : 13.10
File Name                       : prettydeliciouscakes.pdf
Directory                       : .
File Size                       : 4.4 MB
File Modification Date/Time     : 2025:09:28 14:57:17-05:00
File Access Date/Time           : 2025:09:28 14:57:17-05:00
File Inode Change Date/Time     : 2025:09:28 14:57:17-05:00
File Permissions                : -rwxrwx---
File Type                       : PDF
File Type Extension             : pdf
MIME Type                       : application/pdf
PDF Version                     : 1.4
Linearized                      : No
Producer                        : Skia/PDF m142 Google Docs Renderer
Title                           : prettycakes
Language                        : en
Tagged PDF                      : Yes
Page Count                      : 2
```
It didn't work.
My next thought is binwalk:
```bash
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             PDF document, version: "1.4"
1500          0x5DC           Zlib compressed data, default compression
1630          0x65E           Zlib compressed data, default compression
2259          0x8D3           Zlib compressed data, default compression
2016258       0x1EC402        Zlib compressed data, default compression
2016664       0x1EC598        Zlib compressed data, default compression
4380767       0x42D85F        Zlib compressed data, default compression
4381068       0x42D98C        Zlib compressed data, default compression
4381993       0x42DD29        Zlib compressed data, default compression
```
AHA!
Here is something of note. I will extract and examine those files.
There are a ton of files, so I run file on each of them to determine where to start.
```bash
1EC402:      ASCII text
1EC402.zlib: zlib compressed data
1EC598:      data
1EC598.zlib: zlib compressed data
5DC:         ASCII text
5DC.zlib:    zlib compressed data
8D3:         ISO-8859 text, with very long lines (65536), with no line terminators
8D3.zlib:    zlib compressed data
42D85F:      ASCII text
42D85F.zlib: zlib compressed data
42D98C:      color profile 4.3, RGB/XYZ-mntr device, 536 bytes, 1-1-2016, relative colorimetric 'Google/Skia/7C5FA2151397474A0486BBCC83733D59Y '
42D98C.zlib: zlib compressed data
42DD29:      TrueType Font data, 19 tables, 1st "GDEF", 7 names, Microsoft, language 0x409
42DD29.zlib: zlib compressed data
65E:         ASCII text
65E.zlib:    zlib compressed data
```
So turns out, this is pretty much the last step. I started by looking inside the 1EC402 ASCII text file, which revealed nothing, then checked out the 1EC402.zlib file because I don't really know what a zlib file is, which also revealed nothing, then I decided to look at the very next ASCII text file in the list - 5DC - which contained a base64 string:
```bash
c3Vue3AzM3BfZDFzX2ZsQGdfeTAhfQ==
```
After putting it in ![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)&input=YzNWdWUzQXpNM0JmWkRGelgyWnNRR2RmZVRBaGZRPT0), I get the flag.
# Flag
```bash
sun{p33p_d1s_fl@g_y0!}
```
