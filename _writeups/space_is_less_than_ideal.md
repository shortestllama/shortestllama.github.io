---
published: false
layout: writeup
title: Space Is Less Than Ideal
source: SunshineCTF
category: Pwn
date: 2025-09-27
---
At first it wasn't even working, so I went and did other challenges before coming back.
Once I came back and it was working, I used the description as a hint due to the last line saying "Less is more!"
```bash
I think i did a thing.

I _may_ have accessed a satellite.

I can access the logs anyhow. I can't seem to access anything else.

I know I've seen that type of log viewer before, but something seems... different... about it.

Well you know the expression. Less is more!
```
I explored around the interface a bit seeing what all was there and didn't find anything of note necessarily. The major things were the Logs
```bash
2025-09-01T00:00:00.001Z [HK] [POWER] Solar Array Current: 0.00 A | Battery Voltage: 26.7 V | SOC: 87%
2025-09-01T00:00:00.009Z [HK] [THERMAL] Radiator Temp: 15.2 °C | Bus Temp: 14.9 °C | Battery Temp: 16.1 °C
2025-09-01T00:00:00.020Z [COMM] Beacon Sent | Downlink Power: 4.8 W | S-Band RSSI: -68.2 dBm
2025-09-01T00:00:00.025Z [ADCS] Wheel Speeds: X=0 rpm Y=0 rpm Z=0 rpm | Mode: IDLE

2025-09-02T06:15:11.334Z [HK] [POWER] Solar Array Current: 1.45 A | Battery Voltage: 28.1 V | SOC: 96%
2025-09-02T06:15:11.342Z [PAYLOAD] Camera Heater: OFF | CCD Temp: -33.8 °C | Status: STANDBY
2025-09-02T06:15:11.365Z [COMM] Link Margin: 3.2 dB | Uplink Nominal | Frame Error Rate: 0.01%

2025-09-03T14:22:49.112Z [CMD] Uplink Received: CMD[0x41] ENABLE_PAYLOAD | Source: GS-HOUSTON | CRC OK
2025-09-03T14:22:49.134Z [CMD_ACK] CMD[0x41] → EXECUTED SUCCESSFULLY
2025-09-03T14:22:49.200Z [PAYLOAD] Payload Power: ON | CCD Temp: -29.2 °C | Status: ACTIVE

2025-09-04T09:03:25.456Z [HK] [THERMAL] Radiator Temp: 22.7 °C | Bus Temp: 19.3 °C | Battery Temp: 20.4 °C
2025-09-04T09:03:25.471Z [HK] [POWER] Solar Array Current: 1.19 A | Battery Voltage: 27.2 V | SOC: 89%

2025-09-05T11:00:00.000Z [SYNC] Time Update Received from GS-DAR | Delta: +1.843 ms | Sync OK
2025-09-05T11:00:00.047Z [ADCS] Momentum Dump Initiated | Thruster Pulse: -Y, 0.42 s | ΔV: 0.0010 m/s

2025-09-06T13:05:17.445Z [ANOMALY] [THERMAL] Star Tracker Temp High: 46.2 °C (LIMIT: 45.0 °C)
2025-09-06T13:05:17.487Z [ADCS] Star Tracker Mode AUTO → SAFE (thermal protection)
2025-09-06T13:05:17.495Z [EVENT] Attitude Control Reconfig: Coarse Sun Sensors engaged
...
```
and the Video Logs. The logs didn't have any plaintext passwords or flags or anything, but one of the video logs detailed how to run commands inside of vim, which after typing h inside the logs, I discovered they are opened with less (hence the hint).
```bash
                   SUMMARY OF LESS COMMANDS

      Commands marked with * may be preceded by a number, N.
      Notes in parentheses indicate the behavior if N is given.
      A key preceded by a caret indicates the Ctrl key; thus ^K is ctrl-K.

  h  H                 Display this help.
  q  :q  Q  :Q  ZZ     Exit.
 ---------------------------------------------------------------------------

                           MOVING

  e  ^E  j  ^N  CR  *  Forward  one line   (or N lines).
  y  ^Y  k  ^K  ^P  *  Backward one line   (or N lines).
  ESC-j             *  Forward  one file line (or N file lines).
  ESC-k             *  Backward one file line (or N file lines).
  f  ^F  ^V  SPACE  *  Forward  one window (or N lines).
  b  ^B  ESC-v      *  Backward one window (or N lines).
  z                 *  Forward  one window (and set window to N).
  w                 *  Backward one window (and set window to N).
  ESC-SPACE         *  Forward  one window, but don't stop at end-of-file.
  ESC-b             *  Backward one window, but don't stop at beginning-of-file.
  d  ^D             *  Forward  one half-window (and set half-window to N).
```
This opens the door for many cool things, including the ability to execute shell commands inside the interface. At first, I wasn't able to get anything to work, but then I took a step back and considered that the Debug TTY Info page might be useful.
```bash
/dev/pts/42
```
It was.
I could redirect the output of my commands to this interface and the results would be printed to my screen. After some attempts with commands like sudo and cat flag.txt, I finally decided to run ls.
```bash
cat-flag         drop-perms       flag.txt
challenge.sh     fake-term.sh     system_logs.txt
```
This proved fruitful as cat flag.txt was getting blocked due to permissions.
Now I see there are a couple binaries at my disposal to eventually be able to see the contents of flag.txt. I just need to figure out the correct combination.
ls -lisa gives:
```bash
total 76
1863555      8 dr-xr-xr-x    1 root     root          4096 Sep 27 14:20 .
 816299      4 drwxr-xr-x    1 root     root          4096 Sep 27 16:48 ..
1863557     20 -r-xr-sr-x    1 root     flag-read     18512 Sep 27 14:20 cat-flag
1863561      4 -r-xr-xr-x    1 root     root          1865 Sep 23 20:52 challenge.sh
1863556     24 -r-xr-xr-x    1 root     root         18456 Sep 27 14:20 drop-perms
1863560      4 -r-xr-xr-x    1 root     root            72 Sep 23 20:52 fake-term.sh
1863559      4 -r--r-----    1 root     flag-read        55 Sep 23 20:52 flag.txt
1863558      8 -r--r--r--    1 root     root          5619 Sep 23 20:52 system_logs.txt
```
whoami gives:
```bash
unprivileged
```
I can only assume I only have permissions for cat-flag and flag.txt, but since I can't read flag.txt, I will try executing cat-flag.
This works and provides the flag.
# Flag
```bash
sun{less-is-more-no-really-it-is-just-a-symbolic-link}
```
