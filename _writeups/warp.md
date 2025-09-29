---
published: true
layout: writeup
title: Warp
source: SunshineCTF
category: Re
date: 2025-09-28
---
I started by trying to run the binary with no luck:
```bash
Error: MapError(CreateError { name: "rb", code: -1, io_error: Os { code: 1, kind: PermissionDenied, message: "Operation not permitted" } })
```
I then opened it in ghidra and found an insanely long load time, followed by what seemed to be a rust binary.
```C
Result<> __rustcall warp_ebpf::warp_ebpf::main(void)

{
  &[u8] data;
  rlimit rlim;
  Ebpf ebpf;
  Result<> residual;
  Ebpf val;
  String iface;
  String val_1;
  Result<> residual_3;
  Result<> residual_4;
  Result<> residual_5;
  RingBuf<> rb;
  Result<> residual_6;
  RingBuf<> val_2;
  RingBufItem item;
  u8 buffer [33];
  Event event;
  String str;
  Argument args [1];
  Argument args_1 [1];
  Result<> residual_7;
  Xdp *prog;
  Result<> residual_2;
  Result<> residual_1;
  rlimit64 local_8f8 [7];
  ControlFlow<> local_888;
  Result<> local_820;
  undefined local_7b8 [104];
  undefined local_750 [1872];
  
  local_8f8[0].rlim_cur = 0xffffffffffffffff;
  local_8f8[0].rlim_max = 0xffffffffffffffff;
  setrlimit(__RLIMIT_MEMLOCK,local_8f8);
  data.length = 20960;
  data.data_ptr = ARRAY_002e5000;
  aya::bpf::Ebpf::load(&local_820,data);
  core::result::branch<>(&local_888,&local_820);
  if (local_888._0_8_ != -0x7ffffffffffffff7) {
                    /* WARNING: Subroutine does not return */
    memcpy(local_7b8,&local_888,0x68);
  }
                    /* WARNING: Subroutine does not return */
  memcpy(local_750,(void *)((long)&local_888 + 8),0x60);
}
```
The main function only calls this one other function which seems to be loading an ELF binary and branching into that to execute that nested binary.
```C
7f 45 4c 46
```
I immediately assumed it to be an ELF binary because of the magic bytes at the beginning of the data.
I copied these bytes into a file called hex.txt, which I then saved into an object file with this command:
```bash
tr -d '\n' < hex.txt | xxd -r -p > prog.o
```
Running the file command on the prog.o object file reveals that it is actually an eBPF file.
```bash
prog.o: ELF 64-bit LSB relocatable, eBPF, version 1 (SYSV), with debug_info, not stripped
```
Executing strings on the file reveals hidden compiled compiled code within the .rodata section that reveals how to recover the flag.
```C
/home/brosu/Documents/CTF/sunshine/warp-ebpf/src/w-ebpf/main.bpf.c
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    if (data + sizeof(struct ethhdr) > data_end)
    if (h_proto != 0x0800)
    u32 ip_header_len = ip->ihl * 4;
    if (ip_header_len < sizeof(struct iphdr))
    if (ip->protocol == IPPROTO_UDP) {
        struct udphdr *udp = (void *)ip + ip_header_len;
        payload = (void *)(udp + 1);
    } else if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (void *)ip + ip_header_len;
        if ((void *)(tcp + 1) > data_end)
        __u32 tcp_hdr_len = tcp->doff * 4;
        if (tcp_hdr_len < sizeof(struct tcphdr))
    if (payload + prefix_size > data_end)
    if (__builtin_memcmp(payload, prefix, prefix_size) != 0)
    struct event *e = bpf_ringbuf_reserve(&rb, sizeof(*e), 0);
    if (!e)
        if (event_data + i >= data_end)
        e->text[i] = ((char *)event_data)[i];
    for (int i = 0; i < sizeof(check); i++) {
    if (__builtin_memcmp(e->text, f.text, sizeof(check)) == 0) {
        f->text[i] = check[i] ^ 0x60;
        if (f->text[i] >= 33 && f->text[i] <= 126) {
            f->text[i] = 33 + ((f->text[i] + 14) % 94u);
    bpf_ringbuf_submit(e, 0);
```
This code reveals that the flag can potentially be uncovered by reverse engineering the encryption technique at the end and submitting the input content that can be found in the .rodata section.
```bash
llvm-objdump -s -j .rodata prog.o

prog.o: file format elf64-bpf
Contents of section .rodata:
 0000 57347270 00000000 00000000 00000000  W4rp............
 0010 24265f2c 5f3f5f50 58210050 11411550  $&_,_?_PX!.P.A.P
 0020 54205556 50583f50 53232323 232e      T UVPX?PS####.
```
Plugging this into my reverse script gives the flag.
```python
def encode_check(check_bytes):
    out = bytearray()
    for b in check_bytes:
        t = b ^ 0x60
        if 33 <= t <= 126:
            t = 33 + ((t + 14) % 94)
        out.append(t & 0xff)
    return bytes(out)

# .rodata 'check' from prog.o (size 0x1e)
check = bytes.fromhex(
    "24265f2c5f3f5f5058210050114115505420555650583f5053232323232e"
)

payload = b"W4rp" + encode_check(check)

# Print everything and also just the flag
print(payload)               # as bytes
print(payload.hex())         # as hex
try:
    start = payload.index(b"sun{")
    end = payload.index(b"}", start) + 1
    print(payload[start:end].decode())  # the flag
except ValueError:
    pass
```
This script outputs this:
```bash
b'W4rpsun{n0n_gp1_BPF_code_g0_brrrr}'
5734727073756e7b6e306e5f6770315f4250465f636f64655f67305f62727272727d
sun{n0n_gp1_BPF_code_g0_brrrr}
```
# Flag
```bash
sun{n0n_gp1_BPF_code_g0_brrrr}
```
