---
published: false
layout: writeup
title: Space Race
source: SunshineCTF
category: Re
date: 2025-09-28
---
Looking at the challenge description:
```bash
NASA was so excited to send their new unmanned rover out to pick up some stranded astronauts that they forgot to actually write the software to control it. Can you take a look at the onboard ECU software and see if you can find a way to establish communications?

If worse comes to worst, maybe they CAN BUS the astronauts back....
```
it seems that CAN BUS might be useful in this situation. However, I have no idea what that is beyond the fact that it's used for serial connections, so I need to do a bit of research.
I learn that the controls for the rover game need to be sent in this JSON format:
```bash
{"t":"can","frame":"0123456789abcdef"}
```
where the first 4 numbers of the "frame" field correspond to the ID and the remaining numbers correspond to the payload that provide data to the recipient, telling it what to do.
I also learned in my research that 0201 and 0202 are common IDs for this communication protocol, so I start with those and try brute forcing different payload values.
Essentially, the challenge involves me finding the correct payload values to modify the steer and throttle values of the rover in order to complete the game to get the flag. This means modifying the client.py file with the correct values based on key press inputs.
I started by creating a script that would go through all the values as the payload, but it was taking too long. I modified the script to go through all the values of the payload starting with the most significant bit:
```python
import socket
import json
import time

HOST = "chal.sunshinectf.games"
PORT = 25102

# Your frame here (16 hex characters = 8 bytes)
# Example: CAN ID = 0x201 (throttle), data = 0x64 + 7x zero

def main():
        print(f"[+] Connecting to {HOST}:{PORT}...")
        with socket.create_connection((HOST, PORT)) as s:
                print("[+] Connected. Sending CAN frame...")
                i = 0

                # Enter feed loop
                print("[+] Listening for telemetry updates...\n")
                while True:
                        frame = "0202" + hex(i)[2::] + ('0' * (12 - len(hex(i)[2::])))
                        print(frame)
                        packet = {"t": "can", "frame": frame}
                        s.sendall((json.dumps(packet) + "\n").encode())

                        try:
                                line = s.recv(4096).decode(errors='ignore')
                                if not line:
                                        print("[-] Connection closed.")
                                        break
                                for raw in line.strip().splitlines():
                                        try:
                                                obj = json.loads(raw)
                                                if obj.get("t") == "telemetry":
                                                        print(f"[t={obj['time']:.2f}] s={obj['s']:.1f} x={obj['x']:.1f} "
                                                                  f"vel={obj['vel']:.1f} throttle={obj['throttle_pct']}% "
                                                                  f"steer={obj['steer_pct']}% | msg: {obj.get('msg')}")
                                                        if obj.get("flag"):
                                                                print(f"\n🚩 FLAG: {obj['flag']}")
                                                                return
                                        except json.JSONDecodeError:
                                                print("[!] Received malformed JSON:", raw)
                        except KeyboardInterrupt:
                                print("\n[!] Interrupted. Exiting.")
                                break

                        i += 1

if __name__ == "__main__":
        main()
```
This yielded better results:
```bash
020210e000000000
[t=1759117314.70] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
020210f000000000
[t=1759117314.78] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
0202110000000000
[t=1759117314.87] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
0202111000000000
[t=1759117314.95] s=0.0 x=0.0 vel=0.0 throttle=0% steer=16% | msg: Steer 16%
0202112000000000
[t=1759117315.03] s=0.0 x=0.0 vel=0.0 throttle=0% steer=32% | msg: Steer 32%
0202113000000000
[t=1759117315.12] s=0.0 x=0.0 vel=0.0 throttle=0% steer=48% | msg: Steer 48%
0202114000000000
[t=1759117315.20] s=0.0 x=0.0 vel=0.0 throttle=0% steer=64% | msg: Steer 64%
0202115000000000
[t=1759117315.28] s=0.0 x=0.0 vel=0.0 throttle=0% steer=80% | msg: Steer 80%
0202116000000000
[t=1759117315.37] s=0.0 x=0.0 vel=0.0 throttle=0% steer=96% | msg: Steer 96%
0202117000000000
[t=1759117315.45] s=0.0 x=0.0 vel=0.0 throttle=0% steer=100% | msg: Steer 100%
0202118000000000
[t=1759117315.53] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-100% | msg: Steer -100%
0202119000000000
[t=1759117315.62] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-100% | msg: Steer -100%
020211a000000000
[t=1759117315.70] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-96% | msg: Steer -96%
020211b000000000
[t=1759117315.78] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-80% | msg: Steer -80%
020211c000000000
[t=1759117315.87] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-64% | msg: Steer -64%
020211d000000000
[t=1759117315.95] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-48% | msg: Steer -48%
020211e000000000
[t=1759117316.03] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-32% | msg: Steer -32%
020211f000000000
[t=1759117316.12] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-16% | msg: Steer -16%
0202120000000000
[t=1759117316.20] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
0202121000000000
[t=1759117316.28] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
0202122000000000
[t=1759117316.37] s=0.0 x=0.0 vel=0.0 throttle=0% steer=32% | msg: Steer 32%
0202123000000000
[t=1759117316.45] s=0.0 x=0.0 vel=0.0 throttle=0% steer=48% | msg: Steer 48%
0202124000000000
[t=1759117316.53] s=0.0 x=0.0 vel=0.0 throttle=0% steer=64% | msg: Steer 64%
0202125000000000
[t=1759117316.62] s=0.0 x=0.0 vel=0.0 throttle=0% steer=80% | msg: Steer 80%
0202126000000000
[t=1759117316.70] s=0.0 x=0.0 vel=0.0 throttle=0% steer=96% | msg: Steer 96%
0202127000000000
[t=1759117316.78] s=0.0 x=0.0 vel=0.0 throttle=0% steer=100% | msg: Steer 100%
0202128000000000
[t=1759117316.87] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-100% | msg: Steer -100%
0202129000000000
[t=1759117316.95] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-100% | msg: Steer -100%
020212a000000000
[t=1759117317.03] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-96% | msg: Steer -96%
020212b000000000
[t=1759117317.12] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-80% | msg: Steer -80%
020212c000000000
[t=1759117317.20] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-64% | msg: Steer -64%
020212d000000000
[t=1759117317.28] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-48% | msg: Steer -48%
020212e000000000
[t=1759117317.37] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-32% | msg: Steer -32%
020212f000000000
[t=1759117317.45] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-16% | msg: Steer -16%
0202130000000000
[t=1759117317.53] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Steer 0%
0202131000000000
^C
[!] Interrupted. Exiting.
```
Now to narrow the payload to get the specific values I need for the client.py script.
There's quite a bit of output that I won't subject you to reading, but the idea is that now I know how to change the steering power and I want to see what that does for my rover.
```bash
0202117000000000
[t=1759117746.65] s=0.0 x=0.0 vel=0.0 throttle=0% steer=100% | msg: Steer 100%
0202118000000000
[t=1759117746.73] s=0.0 x=0.0 vel=0.0 throttle=0% steer=-100% | msg: Steer -100%
```
I will use these two values for the steering for now.
I also need to do the same for the throttle, but that should be easy because it will just be changing 0202 to 0201.
```bash
0201110000000000
[t=1759117916.29] s=0.0 x=0.0 vel=0.0 throttle=0% steer=0% | msg: Throttle 0%
0201118000000000
[t=1759117917.12] s=1.3 x=0.0 vel=4.1 throttle=100% steer=0% | msg: Throttle 100%
```
I will use these two values to control the throttle.
That's pretty much it.
Here is the script:
```python
import sys, socket, json, threading, queue, time
import pygame

WIDTH, HEIGHT = 900, 600
BG = (8, 10, 16)
FG = (230, 235, 240)
TRACK_CLR = (40, 40, 48)
FINISH_CLR = (220, 220, 220)
ROVER_CLR = (120, 200, 255)
OBST_CLR = (255, 120, 120)
PX_PER_WU = 2.2

def send_frame(net, frame_hex):
    net.sock.sendall((json.dumps({"t":"can","frame":frame_hex}) + "\n").encode())

class Net:
        def __init__(self, host, port):
                self.sock = socket.create_connection((host, port))
                self.r = self.sock.makefile('r', buffering=1, encoding='utf-8', newline='\n')
                self.q = queue.Queue()
                self.alive = True
                threading.Thread(target=self.reader, daemon=True).start()
        def reader(self):
                try:
                        for line in self.r:
                                line = line.strip()
                                if not line:
                                        continue
                                try:
                                        self.q.put(json.loads(line))
                                except Exception:
                                        pass
                except Exception:
                        pass
                self.alive = False

def world_to_screen_x(x_wu, half_width_wu, rover_x=0.0):
        left = WIDTH * 0.2
        right = WIDTH * 0.8
        x_rel = float(x_wu) - float(rover_x)
        t = (x_rel + half_width_wu) / (2 * half_width_wu)
        return int(left + t * (right - left))

def main():
        if len(sys.argv) != 3:
                print(f"usage: python {sys.argv[0]} HOST PORT")
                sys.exit(1)
        host, port = sys.argv[1], int(sys.argv[2])

        net = Net(host, port)
        pygame.init()
        screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Space Race: Rover")
        clock = pygame.time.Clock()
        font = pygame.font.SysFont(None, 20)
        big = pygame.font.SysFont(None, 48)

        latest = None
        flag = None
        flag_time = None

        while True:
                try:
                        while True:
                                obj = net.q.get_nowait()
                                if obj.get("t") == "telemetry":
                                        latest = obj
                                        if obj.get("flag") is not None and flag is None:
                                                flag = obj["flag"]
                                                flag_time = time.time()
                except queue.Empty:
                        pass
                '''

                TODO: Implement the controls for the rover client!

                {"t":"can","frame":"0123456789abcdef"}

                '''
                for e in pygame.event.get():
                        if e.type == pygame.QUIT:
                                pygame.quit(); return
                        if e.type == pygame.KEYDOWN:
                                if e.key in (pygame.K_ESCAPE, pygame.K_q):
                                        pygame.quit(); return
                                elif e.key == pygame.K_UP:
                                        send_frame(net, "0201118000000000")
                                elif e.key == pygame.K_DOWN:
                                        send_frame(net, "0201110000000000")
                                elif e.key == pygame.K_LEFT:
                                        send_frame(net, "0202118000000000")
                                elif e.key == pygame.K_RIGHT:
                                        send_frame(net, "0202117000000000")
                                elif e.key == pygame.K_b:
                                        pass
                                elif e.key == pygame.K_s:
                                        pass
                                elif e.key == pygame.K_r:
                                        pass

                screen.fill(BG)

                if latest:
                        track = latest.get("track", {})
                        half_w = float(track.get("half_width", 60.0))
                        rover_x = float(latest.get("x", 0.0))
                        tlx = world_to_screen_x(-half_w, half_w, rover_x)
                        trx = world_to_screen_x(+half_w, half_w, rover_x)
                        track_px_w = max(1, trx - tlx)
                        pygame.draw.rect(screen, TRACK_CLR, (tlx, 0, track_px_w, HEIGHT), border_radius=12)

                        s = float(latest.get("s", 0.0))
                        length = float(track.get("length", 1.0))
                        progress = s / max(1.0, length)
                        if progress > 0.85:
                                for y in range(0, HEIGHT, 14):
                                        pygame.draw.line(screen, FINISH_CLR, (trx, y), (trx, y+7), 3)

                        obs = latest.get("obstacles", [])
                        if obs is not None:
                                for ob in obs:
                                        try:
                                                dy = float(ob["dy"])
                                                if dy < 0:
                                                        continue
                                                y = int(HEIGHT/2 - dy * PX_PER_WU)
                                                x = world_to_screen_x(float(ob["x"]), half_w, rover_x)
                                                w_px = max(6, int((float(ob["w"]) / (2 * half_w)) * track_px_w))
                                                rect = pygame.Rect(x - w_px//2, y - 10, w_px, 20)
                                                pygame.draw.rect(screen, OBST_CLR, rect, border_radius=4)
                                        except (KeyError, ValueError, TypeError):
                                                continue

                        rover_rect = pygame.Rect(WIDTH//2 - 16, HEIGHT//2 + 18, 32, 44)
                        pygame.draw.rect(screen, ROVER_CLR, rover_rect, border_radius=6)
                        pygame.draw.rect(screen, FG, rover_rect, 2, border_radius=6)

                        hud = [
                                f"Status: {latest.get('status','')}",
                                f"Dist: {s:.1f}/{length:.0f} wu",
                                f"Lateral x: {rover_x:.1f} wu",
                                f"Speed: {float(latest.get('vel',0.0)):.2f} wu/s",
                                f"Throttle: {latest.get('throttle_pct',0)}%  Steer: {latest.get('steer_pct',0)}%",
                                f"{str(latest.get('msg',''))[:64]}",
                        ]
                        for i, line in enumerate(hud):
                                img = font.render(line, True, FG)
                                screen.blit(img, (12, 10 + i*18))

                if flag:
                        img = big.render(flag, True, (255, 240, 120))
                        screen.blit(img, img.get_rect(center=(WIDTH//2, HEIGHT//2 - 80)))
                        if time.time() - flag_time > 6:
                                pygame.quit(); return

                pygame.display.flip()
                clock.tick(60)

if __name__ == "__main__":
        main()
```
And here is the result from correctly executing the script:
![](/assets/images/writeups/SunshineCTF/Space_Race/flag.png)
# Flag
```bash
sun{r3d_r0v3r_c0m3_0v3r}
```
