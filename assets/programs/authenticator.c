#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

//login with username and password
//then, allow the player to input data
//that's where the fstring vuln is because you're not gonna print back out their login credentials...
//actually, the fstring vuln is technically where they can see data on current inmates
//	if joker is the input, give name, height, weight, etc.
//	if two-face, "" ""
//	if %p, that's the vuln
//after that, they'll go back to input data and give their payload using the exploited address
//all of this only makes sense if ASLR is enabled
//	so if that's enabled, what if we just make this challenge have all protections enabled
//		NX means no shellcode, but ret2libc or ROP
//		canary means fstring overwrite
//DONT FORGET TO INCLUDE OBFUSCATION!!!
//JZ JNZ CALL "NOP" instructions

typedef struct {
	int id;
	char name[32];
	char description[256];
} inmate;

inmate INMATES[256];
int num_inmates = 0;

void menu() {
	printf("\n\n");
	printf("================================\n");
	printf("      Welcome, Aaron Cash!      \n");
	printf("================================\n");
	printf("\n\nPlease select an option:\n");
	printf("1. Display Inmate Profile\n");
	printf("2. Add Inmate Profile\n");
	printf("3. Edit Inmate Profile\n");
	printf("4. Remove Inmate Profile\n");
	printf("5. Exit\n");
}

int get_selection() {
	int option;

	printf("> ");
	scanf("%d", &option);

	return option;
}

void display() {
	int inmate;

	printf("Which inmate would you like to display? (0-255)\n");
	printf("> ");
	scanf("%d", &inmate);
	printf("Name: %s\n", INMATES[inmate].name);
	printf("ID: %d\n", INMATES[inmate].id);
	printf(INMATES[inmate].description);
	printf("\n");
}

void add() {
	printf("Name: ");
	scanf("%s", INMATES[num_inmates].name);
	printf("ID: ");
	scanf("%d", &INMATES[num_inmates].id);
	printf("Description: ");
	scanf("%s", INMATES[num_inmates].description);

	num_inmates++;
}

int main(int argc, char *argv[]) {
	/*
	char buf[64];
	printf("Enter name: ");
	fgets(buf, sizeof(buf), stdin);
	printf(buf);
	printf("Enter payload: ");
	*/

	char username_input[32];
	char password_input[32];
	char *username = "ACash";
	char *password = "Cr0c>W4ll3t";
	printf("Username: ");
	scanf("%s", username_input);
	printf("Password: ");
	scanf("%s", password_input);

	int uname = strcmp(username_input, username);
	int pword = strcmp(password_input, password);

	if (uname == 0 && pword == 0) {
		//TODO: initialize array

		while (true) {
			menu();
			int option = get_selection();

			switch (option) {
				case 1:
					display();
					break;
				case 2:
					add();
					break;
				case 3:
					//TODO: edit
					break;
				case 4:
					//TODO: remove
					break;
				case 5:
					exit(0);
					break;
				default:
					printf("%d is not an option.", option);
			}
		}
	}

	else {
		printf("Incorrect username or password");
		exit(0);
	}

	return 0;
}
