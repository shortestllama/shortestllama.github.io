#include <stdlib.h>
#include <stdio.h>

void menu() {
	printf("================================\n");
	printf("        Welcome, Batman!        \n");
	printf("================================\n");
	printf("\n\nPlease select an option:\n");
	printf("1. Character Synopsis\n");
	printf("2. Input Character\n");
	printf("3. Delete Character\n");
	printf("4. Exit\n");
}

char* select_character() {
	char verify[2];
	char name[2];

	printf("Enter a name...\n");
	scanf(name, 2, stdin);
	int villain = atoi(name);

	switch(villain) {
		default:
			printf("%d not in system\n", name);
			printf("Would you like to add them?\n");
			printf("> ");
			fgets(verify, 2, stdin);
	}

	return verify;
}

int win() {
  printf("WIN");
  return 0;
}

int vuln() {
  char buf[64];
  printf("Enter your name: ");
  fflush(stdout);
  fgets(buf, 104, stdin);
  return 0;
}

int main(int argc, char *argv[]) {
	//vuln();
	char input[2];

	menu();
	printf("> ");
	fgets(input, 2, stdin);
	int option = atoi(input);

	switch(option) {
		case 1:
			char* add = select_character();
			if (add == "y") {
				printf("yes");
				//TODO
				//add_character();
			}
			break;
		case 2:
			//TODO
			break;
		case 3:
			//TODO
			printf("3\n");
			break;
		case 4:
			exit(0);
			break;
		default:
			printf("%d is not an option", option);
			break;
	}
}
