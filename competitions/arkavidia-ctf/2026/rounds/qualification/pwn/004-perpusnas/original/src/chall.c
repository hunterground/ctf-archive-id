#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

struct Book {
    char title[0x8];
    char content[0x150];
};

struct Book* slots[7];

char adminPass[0x11];

void init() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    for (int i = 1; i < sizeof(adminPass) - 1; i++) {
        adminPass[i] = (rand() % (126 - 33)) + 33; 
    }
    adminPass[sizeof(adminPass) - 1] = '\0';
}

void menu() {
    printf("\n1. Add Book\n");
    printf("2. Delete Book\n");
    printf("3. Exit\n");
    printf("Choice: ");
}

int read_int() {
    int val;
    scanf("%d", &val);
    getchar(); 
    return val;
}

void add_book() {
    int idx;
    printf("Index (0-6): ");
    idx = read_int();
    
    if (idx < 0 || idx >= 7) {
        printf("Invalid index!\n");
        return;
    }
    
    if (slots[idx] != NULL) {
        printf("Slot already occupied!\n");
        return;
    }
    
    slots[idx] = (struct Book*)malloc(sizeof(struct Book));
    if (slots[idx] == NULL) {
        printf("Malloc failed!\n");
        exit(1);
    }
    
    printf("Title: ");
    ssize_t bytes = read(0, slots[idx]->title, sizeof(slots[idx]->title) - 1);
    if (bytes > 0) {
        slots[idx]->title[bytes] = '\0';
    } else {
        slots[idx]->title[0] = '\0';
    }
    
    printf("Content: ");
    bytes = read(0, slots[idx]->content, sizeof(slots[idx]->content) + 0x18);
}

void delete_book() {
    int idx;
    printf("Index (0-6): ");
    idx = read_int();
    
    if (idx < 0 || idx >= 7) {
        printf("Invalid index!\n");
        return;
    }
    
    if (slots[idx] == NULL) {
        printf("No book at this index!\n");
        return;
    }
    
    printf("Deleting book: ");
    write(1, slots[idx]->title, sizeof(slots[idx]->title));
    printf("\n");
    
    free(slots[idx]);
    slots[idx] = NULL; 
}

void admin() {
    char user[0x6];
    char password[0x10];

    printf("Username: ");
    ssize_t bytes = read(0, user, sizeof(user));
    printf("Password: ");
    bytes = read(0, password, sizeof(password));
    if(strcmp(user, "admin\n") == 0 && strcmp(password, adminPass) == 0) {
        printf("Testing Malloc...");
        printf("Debug Info:\n");
        void *t = malloc(0x10);
        printf("[+] Allocated chunk at: %p\n", t);
        printf("Hope its useful :)\n");
    }
}
int main() {
    init();
    int choice;
    int chance = 1;
    
    printf("=== Perpusnas Management System ===\n");
    
    while (1) {
        menu();
        choice = read_int();
        
        switch (choice) {
            case 1:
                add_book();
                break;
            case 2:
                delete_book();
                break;
            case 3:
                printf("Exiting...\n");
                exit(0);
            case 67:
                if (chance-- <= 0) {
                    printf("== Feature Closed ==\n");
                    break;
                }
                printf("== Debug Admin Feature ==\n");
                admin();
                break;
            default:
                printf("Invalid choice!\n");
        }
    }
    return 0;
}
