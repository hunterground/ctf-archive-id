#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MAX_USERS 10
#define MAX_MESSAGES 20
#define MAX_BROADCASTS 20
#define MAX_MSG_LEN 0x3f0

// --- Structs ---
typedef struct {
    char *content;
    size_t size;
    int from_id;
    int to_id;
    int msg_id;
} Message;

typedef struct {
    char* content;
    size_t size;
    int original_msg_id;
    int original_from_id;
    int broadcaster_id;
} Broadcast;

typedef struct {
    char name[32];
    int user_id;
} User;

// --- Globals ---
User *users[MAX_USERS] = {NULL};
Message *messages[MAX_MESSAGES] = {NULL};
Broadcast *broadcasts[MAX_BROADCASTS] = {NULL};
int user_count = 0;
int message_count = 0;
int broadcast_count = 0;
int current_user_id = -1;

// --- Utils ---
void setup() {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

int read_int() {
    char buf[16];
    read(STDIN_FILENO, buf, 15);
    return atoi(buf);
}

// --- User Functions ---
void create_user() {
    if (user_count >= MAX_USERS) { puts("Max users reached."); return; }
    User *user = malloc(sizeof(User));
    printf("Username: ");
    read(STDIN_FILENO, user->name, 31);
    user->name[strcspn(user->name, "\n")] = 0;
    user->user_id = user_count;
    users[user_count++] = user;
    printf("User '%s' created with ID %d.\n", user->name, user->user_id);
}

void switch_user() {
    printf("Enter User ID to switch to: ");
    int id = read_int();
    if (id < 0 || id >= user_count) { puts("Invalid user ID."); return; }
    current_user_id = id;
    printf("Switched to user %s.\n", users[current_user_id]->name);
}

// --- Message Functions ---
void send_message() {
    if (current_user_id == -1) { puts("You must be logged in."); return; }
    if (message_count >= MAX_MESSAGES) { puts("Message inbox is full."); return; }

    printf("Send to user ID: ");
    int to_id = read_int();
    if (to_id < 0 || to_id >= user_count) { puts("Invalid recipient ID."); return; }

    printf("Size of message: ");
    size_t size = read_int();
    if (size == 0 || size > MAX_MSG_LEN) { puts("Invalid size."); return; }

    Message *msg = malloc(sizeof(Message));
    msg->content = malloc(size);
    msg->size = size;
    msg->from_id = current_user_id;
    msg->to_id = to_id;
    msg->msg_id = message_count;

    printf("Content: ");
    read(STDIN_FILENO, msg->content, size);

    messages[message_count++] = msg;
    puts("Message sent.");
}

void edit_message() {
    printf("Message ID to edit: ");
    int msg_id = read_int();
    if (msg_id < 0 || msg_id >= message_count || messages[msg_id] == NULL) { puts("Invalid message ID."); return; }

    Message *msg = messages[msg_id];
    if (msg->from_id != current_user_id) { puts("You can only edit your own original messages."); return; }

    printf("New content: ");
    char temp_buf[MAX_MSG_LEN + 1] = {0};
    read(STDIN_FILENO, temp_buf, MAX_MSG_LEN);
    size_t new_len = strlen(temp_buf);

    if (new_len > msg->size) {
        char *new_content = realloc(msg->content, new_len);
        if (!new_content) { puts("Reallocation failed."); return; }
        msg->content = new_content;
        msg->size = new_len;
    }
    memcpy(msg->content, temp_buf, new_len);
    puts("Message edited.");
}

void broadcast_message() {
    if (broadcast_count >= MAX_BROADCASTS) { puts("Broadcast board is full."); return; }

    printf("Message ID to broadcast: ");
    int msg_id = read_int();
    if (msg_id < 0 || msg_id >= message_count || messages[msg_id] == NULL) { puts("Invalid message ID."); return; }

    Message *original_msg = messages[msg_id];

    if (original_msg->from_id != current_user_id && original_msg->to_id != current_user_id) {
        puts("You can only broadcast messages you sent or received.");
        return;
    }

    Broadcast *bcast = malloc(sizeof(Broadcast));
    bcast->content = original_msg->content; // VULNERABILITY: Pointer to content is copied.
    bcast->size = original_msg->size;
    bcast->original_msg_id = original_msg->msg_id;
    bcast->original_from_id = original_msg->from_id;
    bcast->broadcaster_id = current_user_id;

    broadcasts[broadcast_count++] = bcast;
    puts("Message broadcasted.");
}

void edit_broadcast_message() {
    printf("Broadcast Index to edit: ");
    int bcast_idx = read_int();
    if (bcast_idx < 0 || bcast_idx >= broadcast_count || broadcasts[bcast_idx] == NULL) { puts("Invalid broadcast index."); return; }

    Broadcast *bcast = broadcasts[bcast_idx];
    if (bcast->broadcaster_id != current_user_id) { puts("This is not your broadcast."); return; }

    printf("New content for broadcast message: ");
    // UAF Write: Writes through the (potentially dangling) content pointer
    read(STDIN_FILENO, bcast->content, bcast->size);
    puts("Broadcast message content overwritten.");
}

void view_broadcasts() {
    puts("--- Broadcast Board ---");
    for (int i = 0; i < broadcast_count; i++) {
        Broadcast *bcast = broadcasts[i];
        if (bcast) {
            printf("Broadcast Index: %d | Broadcast by: %d | Original Msg ID: %d\n", 
                i, bcast->broadcaster_id, bcast->original_msg_id);
            printf("Content: %s\n", bcast->content);
            puts("---------------------");
        }
    }
}

void view_conversation() {
    if (current_user_id == -1) { puts("You must be logged in."); return; }
    printf("View conversation with user ID: ");
    int partner_id = read_int();
    if (partner_id < 0 || partner_id >= user_count) { puts("Invalid user ID."); return; }

    printf("--- Conversation with %s ---\n", users[partner_id]->name);
    for (int i = 0; i < message_count; i++) {
        Message *msg = messages[i];
        if (msg) {
            if ((msg->from_id == current_user_id && msg->to_id == partner_id) ||
                (msg->from_id == partner_id && msg->to_id == current_user_id))
            {
                printf("Msg ID: %d | From: %d | To: %d\n", msg->msg_id, msg->from_id, msg->to_id);
                printf("Content: %s\n", msg->content);
                puts("---------------------");
            }
        }
    }
}

// --- Main Loop ---
void menu() {
    puts("\n--- BeeChat ---");
    if (current_user_id != -1) {
        printf("Logged in as: %s (ID: %d)\n", users[current_user_id]->name, current_user_id);
    }
    puts("1. Create User");
    puts("2. Switch User");
    puts("3. Send Message");
    puts("4. Edit Original Message");
    puts("5. Broadcast Message");
    puts("6. Edit Broadcast Message");
    puts("7. View Broadcasts");
    puts("8. View Conversation");
    puts("9. Exit");
    printf("> ");
}

int main() {
    setup();
    int choice;
    while(1) {
        menu();
        choice = read_int();
        switch(choice) {
            case 1: create_user(); break;
            case 2: switch_user(); break;
            case 3: send_message(); break;
            case 4: edit_message(); break;
            case 5: broadcast_message(); break;
            case 6: edit_broadcast_message(); break;
            case 7: view_broadcasts(); break;
            case 8: view_conversation(); break;
            case 9: exit(0);
            default: puts("Invalid choice."); break;
        }
    }
    return 0;
}