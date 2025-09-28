---
published: false
layout: writeup
title: t0le t0le
source: SunshineCTF
category: Forensics
date: 2025-09-28
---
I start this one by opening it in word and see a lot of potential routes. The images in the docx could be steg, but I'll start with binwalking the docx:
```bash
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             Zip archive data, at least v2.0 to extract, compressed size: 417, uncompressed size: 1954, name: [Content_Types].xml
986           0x3DA           Zip archive data, at least v2.0 to extract, compressed size: 239, uncompressed size: 590, name: _rels/.rels
1786          0x6FA           Zip archive data, at least v2.0 to extract, compressed size: 5204, uncompressed size: 36844, name: word/document.xml
7037          0x1B7D          Zip archive data, at least v2.0 to extract, compressed size: 367, uncompressed size: 2153, name: word/_rels/document.xml.rels
7726          0x1E2E          Zip archive data, at least v2.0 to extract, compressed size: 738, uncompressed size: 3196, name: word/footnotes.xml
8512          0x2140          Zip archive data, at least v2.0 to extract, compressed size: 737, uncompressed size: 3190, name: word/endnotes.xml
9296          0x2450          Zip archive data, at least v2.0 to extract, compressed size: 1699, uncompressed size: 6400, name: word/header1.xml
11041         0x2B21          Zip archive data, at least v2.0 to extract, compressed size: 186, uncompressed size: 290, name: word/_rels/header1.xml.rels
11284         0x2C14          Zip archive data, at least v1.0 to extract, compressed size: 37089, uncompressed size: 37089, name: word/media/image1.png
48424         0xBD28          Zip archive data, at least v1.0 to extract, compressed size: 125657, uncompressed size: 125657, name: word/media/image2.png
174132        0x2A834         Zip archive data, at least v1.0 to extract, compressed size: 278306, uncompressed size: 278306, name: word/media/image3.png
452489        0x6E789         Zip archive data, at least v1.0 to extract, compressed size: 152042, uncompressed size: 152042, name: word/media/image4.png
604582        0x939A6         Zip archive data, at least v2.0 to extract, compressed size: 896, uncompressed size: 11180, name: word/media/image5.emf
605529        0x93D59         Zip archive data, at least v2.0 to extract, compressed size: 602, uncompressed size: 3072, name: word/embeddings/oleObject1.bin
606191        0x93FEF         Zip archive data, at least v1.0 to extract, compressed size: 6779, uncompressed size: 6779, name: word/media/image6.jpeg
613022        0x95A9E         Zip archive data, at least v1.0 to extract, compressed size: 11124, uncompressed size: 11124, name: word/media/image7.jpeg
624198        0x98646         Zip archive data, at least v2.0 to extract, compressed size: 1836, uncompressed size: 8717, name: word/theme/theme1.xml
626085        0x98DA5         Zip archive data, at least v2.0 to extract, compressed size: 1169, uncompressed size: 3604, name: word/settings.xml
627301        0x99265         Zip archive data, at least v2.0 to extract, compressed size: 4315, uncompressed size: 44594, name: word/styles.xml
631661        0x9A36D         Zip archive data, at least v2.0 to extract, compressed size: 376, uncompressed size: 1083, name: word/webSettings.xml
632087        0x9A517         Zip archive data, at least v2.0 to extract, compressed size: 515, uncompressed size: 1749, name: word/fontTable.xml
632650        0x9A74A         Zip archive data, at least v2.0 to extract, compressed size: 358, uncompressed size: 727, name: docProps/core.xml
633319        0x9A9E7         Zip archive data, at least v2.0 to extract, compressed size: 374, uncompressed size: 715, name: docProps/app.xml
635517        0x9B27D         End of Zip archive, footer length: 22
```
There's a lot here, but let's start with extracting it and running file on each of them.
```bash
0.zip:               Microsoft Word 2007+
[Content_Types].xml: XML 1.0 document, ASCII text, with very long lines (1897), with CRLF line terminators
docProps:            directory
_rels:               directory
word:                directory
```
Ok it actually seems like it might be more manageable than I thought.
My first thought was that it might just be in plaintext in one of the files, so I tried searching for "sun{" in every file:
```bash
find . -type f -exec sh -c 'echo "Searching in {}"; grep "sun{" "{}"' \;
Searching in ./[Content_Types].xml
Searching in ./_rels/.rels
Searching in ./word/embeddings/oleObject1.bin
Searching in ./word/endnotes.xml
Searching in ./word/_rels/header1.xml.rels
Searching in ./word/_rels/document.xml.rels
Searching in ./word/fontTable.xml
Searching in ./word/styles.xml
Searching in ./word/document.xml
Searching in ./word/settings.xml
Searching in ./word/header1.xml
Searching in ./word/footnotes.xml
Searching in ./word/webSettings.xml
Searching in ./word/media/image6.jpeg
Searching in ./word/media/image7.jpeg
Searching in ./word/media/image4.png
Searching in ./word/media/image1.png
Searching in ./word/media/image2.png
Searching in ./word/media/image3.png
Searching in ./word/media/image5.emf
Searching in ./word/theme/theme1.xml
Searching in ./docProps/core.xml
Searching in ./docProps/app.xml
Searching in ./0.zip
```
Following that, I went back to the challenge description, which mentions the cat images, so I decided to examine the images more closely with exiftool:
```bash
======== image1.png
ExifTool Version Number         : 13.10
File Name                       : image1.png
Directory                       : .
File Size                       : 37 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 180
Image Height                    : 156
Bit Depth                       : 8
Color Type                      : RGB
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
White Point X                   : 0.3127
White Point Y                   : 0.329
Red X                           : 0.64
Red Y                           : 0.33
Green X                         : 0.3
Green Y                         : 0.6
Blue X                          : 0.15
Blue Y                          : 0.06
Background Color                : 255 255 255
Modify Date                     : 2025:05:04 22:25:15
Warning                         : [minor] Text/EXIF chunk(s) found after PNG IDAT (may be ignored by some readers) [x11]
Datecreate                      : 2025-05-04T22:25:15+00:00
Datemodify                      : 2025-05-04T22:25:15+00:00
Datetimestamp                   : 2025-05-04T22:25:15+00:00
Software                        : https://imagemagick.org
Thumb Document Pages            : 1
Thumb Image Height              : 1024
Thumb Image Width               : 1179
Thumb Mimetype                  : image/png
Thumb M Time                    : 1746397515
Thumb Size                      : 1.17571MB
Thumb URI                       : file:///tmp/thumblr/img14393616061614485664
Image Size                      : 180x156
Megapixels                      : 0.028
======== image2.png
ExifTool Version Number         : 13.10
File Name                       : image2.png
Directory                       : .
File Size                       : 126 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 364
Image Height                    : 289
Bit Depth                       : 8
Color Type                      : RGB with Alpha
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
SRGB Rendering                  : Perceptual
Gamma                           : 2.2
Pixels Per Unit X               : 3779
Pixels Per Unit Y               : 3779
Pixel Units                     : meters
Image Size                      : 364x289
Megapixels                      : 0.105
======== image3.png
ExifTool Version Number         : 13.10
File Name                       : image3.png
Directory                       : .
File Size                       : 278 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 514
Image Height                    : 487
Bit Depth                       : 8
Color Type                      : RGB with Alpha
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
SRGB Rendering                  : Perceptual
Gamma                           : 2.2
Pixels Per Unit X               : 3779
Pixels Per Unit Y               : 3779
Pixel Units                     : meters
Image Size                      : 514x487
Megapixels                      : 0.250
======== image4.png
ExifTool Version Number         : 13.10
File Name                       : image4.png
Directory                       : .
File Size                       : 152 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 331
Image Height                    : 377
Bit Depth                       : 8
Color Type                      : RGB with Alpha
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
SRGB Rendering                  : Perceptual
Gamma                           : 2.2
Pixels Per Unit X               : 3779
Pixels Per Unit Y               : 3779
Pixel Units                     : meters
Image Size                      : 331x377
Megapixels                      : 0.125
======== image5.emf
ExifTool Version Number         : 13.10
File Name                       : image5.emf
Directory                       : .
File Size                       : 11 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
Error                           : Unknown file type
======== image6.jpeg
ExifTool Version Number         : 13.10
File Name                       : image6.jpeg
Directory                       : .
File Size                       : 6.8 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : None
X Resolution                    : 1
Y Resolution                    : 1
Image Width                     : 201
Image Height                    : 251
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:4:4 (1 1)
Image Size                      : 201x251
Megapixels                      : 0.050
======== image7.jpeg
ExifTool Version Number         : 13.10
File Name                       : image7.jpeg
Directory                       : .
File Size                       : 11 kB
File Modification Date/Time     : 1980:01:01 00:00:00-06:00
File Access Date/Time           : 2025:09:28 15:13:27-05:00
File Inode Change Date/Time     : 2025:09:28 15:10:23-05:00
File Permissions                : -rw-rw-r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : None
X Resolution                    : 1
Y Resolution                    : 1
Profile CMM Type                : Little CMS
Profile Version                 : 4.3.0
Profile Class                   : Display Device Profile
Color Space Data                : RGB
Profile Connection Space        : XYZ
Profile Date Time               : 0000:00:00 00:00:00
Profile File Signature          : acsp
Primary Platform                : Apple Computer Inc.
CMM Flags                       : Not Embedded, Independent
Device Manufacturer             : 
Device Model                    : 
Device Attributes               : Reflective, Glossy, Positive, Color
Rendering Intent                : Perceptual
Connection Space Illuminant     : 0.9642 1 0.82491
Profile Creator                 : Little CMS
Profile ID                      : 0
Profile Description             : sRGB built-in
Profile Copyright               : No copyright, use freely
Media White Point               : 0.9642 1 0.82491
Chromatic Adaptation            : 1.048 0.02299 -0.05014 0.02971 0.99034 -0.01706 -0.00923 0.01501 0.75226
Red Matrix Column               : 0.43585 0.22238 0.01392
Blue Matrix Column              : 0.14302 0.06059 0.71384
Green Matrix Column             : 0.38533 0.71704 0.09714
Red Tone Reproduction Curve     : (Binary data 32 bytes, use -b option to extract)
Green Tone Reproduction Curve   : (Binary data 32 bytes, use -b option to extract)
Blue Tone Reproduction Curve    : (Binary data 32 bytes, use -b option to extract)
Chromaticity Channels           : 3
Chromaticity Colorant           : Unknown
Chromaticity Channel 1          : 0.64 0.33
Chromaticity Channel 2          : 0.3 0.60001
Chromaticity Channel 3          : 0.14999 0.06
Image Width                     : 400
Image Height                    : 400
Encoding Process                : Progressive DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Image Size                      : 400x400
Megapixels                      : 0.160
    7 image files read
```
The only thing of note here was potentially the binary data portion, but running the -b flag yielded no results.
I then started searching around the directory some more to see if there were any hidden files.
```bash
ls -R -lisa                                               
.:
total 648
1729831   4 drwxrwxr-x 5 kali kali   4096 Sep 28 15:11  .
1729808   4 drwxrwx--- 3 kali kali   4096 Sep 28 15:10  ..
1729832 624 -rw-rw-r-- 1 kali kali 635539 Sep 28 15:10  0.zip
1729833   4 -rw-rw-r-- 1 kali kali   1954 Jan  1  1980 '[Content_Types].xml'
1729860   4 drwxrwxr-x 2 kali kali   4096 Sep 28 15:10  docProps
1729834   4 drwxrwxr-x 2 kali kali   4096 Sep 28 15:12  _rels
1729836   4 drwxrwxr-x 6 kali kali   4096 Sep 28 15:10  word

./docProps:
total 16
1729860 4 drwxrwxr-x 2 kali kali 4096 Sep 28 15:10 .
1729831 4 drwxrwxr-x 5 kali kali 4096 Sep 28 15:11 ..
1729862 4 -rw-rw-r-- 1 kali kali  715 Jan  1  1980 app.xml
1729861 4 -rw-rw-r-- 1 kali kali  727 Jan  1  1980 core.xml

./_rels:
total 12
1729834 4 drwxrwxr-x 2 kali kali 4096 Sep 28 15:12 .
1729831 4 drwxrwxr-x 5 kali kali 4096 Sep 28 15:11 ..
1729835 4 -rw-rw-r-- 1 kali kali  590 Jan  1  1980 .rels

./word:
total 132
1729836  4 drwxrwxr-x 6 kali kali  4096 Sep 28 15:10 .
1729831  4 drwxrwxr-x 5 kali kali  4096 Sep 28 15:11 ..
1729837 36 -rw-rw-r-- 1 kali kali 36844 Jan  1  1980 document.xml
1729850  4 drwxrwxr-x 2 kali kali  4096 Sep 28 15:10 embeddings
1729841  4 -rw-rw-r-- 1 kali kali  3190 Jan  1  1980 endnotes.xml
1729859  4 -rw-rw-r-- 1 kali kali  1749 Jan  1  1980 fontTable.xml
1729840  4 -rw-rw-r-- 1 kali kali  3196 Jan  1  1980 footnotes.xml
1729842  8 -rw-rw-r-- 1 kali kali  6400 Jan  1  1980 header1.xml
1729844  4 drwxrwxr-x 2 kali kali  4096 Sep 28 15:10 media
1729838  4 drwxrwxr-x 2 kali kali  4096 Sep 28 15:10 _rels
1729856  4 -rw-rw-r-- 1 kali kali  3604 Jan  1  1980 settings.xml
1729857 44 -rw-rw-r-- 1 kali kali 44594 Jan  1  1980 styles.xml
1729854  4 drwxrwxr-x 2 kali kali  4096 Sep 28 15:10 theme
1729858  4 -rw-rw-r-- 1 kali kali  1083 Jan  1  1980 webSettings.xml

./word/embeddings:
total 12
1729850 4 drwxrwxr-x 2 kali kali 4096 Sep 28 15:10 .
1729836 4 drwxrwxr-x 6 kali kali 4096 Sep 28 15:10 ..
1729851 4 -rw-rw-r-- 1 kali kali 3072 Jan  1  1980 oleObject1.bin

./word/media:
total 628
1729844   4 drwxrwxr-x 2 kali kali   4096 Sep 28 15:10 .
1729836   4 drwxrwxr-x 6 kali kali   4096 Sep 28 15:10 ..
1729845  40 -rw-rw-r-- 1 kali kali  37089 Jan  1  1980 image1.png
1729846 124 -rw-rw-r-- 1 kali kali 125657 Jan  1  1980 image2.png
1729847 272 -rw-rw-r-- 1 kali kali 278306 Jan  1  1980 image3.png
1729848 152 -rw-rw-r-- 1 kali kali 152042 Jan  1  1980 image4.png
1729849  12 -rw-rw-r-- 1 kali kali  11180 Jan  1  1980 image5.emf
1729852   8 -rw-rw-r-- 1 kali kali   6779 Jan  1  1980 image6.jpeg
1729853  12 -rw-rw-r-- 1 kali kali  11124 Jan  1  1980 image7.jpeg

./word/_rels:
total 16
1729838 4 drwxrwxr-x 2 kali kali 4096 Sep 28 15:10 .
1729836 4 drwxrwxr-x 6 kali kali 4096 Sep 28 15:10 ..
1729839 4 -rw-rw-r-- 1 kali kali 2153 Jan  1  1980 document.xml.rels
1729843 4 -rw-rw-r-- 1 kali kali  290 Jan  1  1980 header1.xml.rels

./word/theme:
total 20
1729854  4 drwxrwxr-x 2 kali kali 4096 Sep 28 15:10 .
1729836  4 drwxrwxr-x 6 kali kali 4096 Sep 28 15:10 ..
1729855 12 -rw-rw-r-- 1 kali kali 8717 Jan  1  1980 theme1.xml
```
I didn't find any previously undiscovered hidden files, but I did see a file in ./word/embeddings that had caught my eye previously, but I didn't try looking at it first.
Opening it up in vim revealed some interesting data:
```vim
��ࡱ▒�>��        ��������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������Root Entry��������
                                  �F�CompObj������������LObjInfo����Ole10Native▒���������������������
������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������
����
    �F
      OLE PackagPackage�9�q@�vroC:\Users\ardy\Downloads\vrosC:\Users\ardy\AppData\Local\Temp\{016E985C-CACE-4FD5-BE62-7088A89D6E7F}\{07D47D53-4E54-46B2-9C7A-31322E56717A}\vro%Zmhhe2cweXJfZzB5cl96bF9vM3kwaTNxIX0=
rC:\Users\ardy\AppData\Local\Temp\{016E985C-CACE-4FD5-BE62-7088A89D6E7F}\{07D47D53-4E54-46B2-9C7A-31322E56717A}\vrovro:\Users\ardy\Downloads\vro
```
Of note was the data at the end which seemed to contain a base64 string.
Throwing it in ![Cyber Chef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true,false)ROT13(true,true,false,13)&input=Wm1oaGUyY3dlWEpmWnpCNWNsOTZiRjl2TTNrd2FUTnhJWDA9) revealed that I was correct, but that it also had other encryption. My first thought was ROT13 and that turned out to work.
# Flag
```bash
sun{t0le_t0le_my_b3l0v3d!}
```
