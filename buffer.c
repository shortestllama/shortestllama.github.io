#include <stdlib.h>
#include <stdio.h>

int win() {
  system("/bin/sh");
  return 0;
}

int main(int argc, char *argv[]) {
  char buf[64];
  printf("Enter your name: ");
  gets(buf);
  return 0;
}
