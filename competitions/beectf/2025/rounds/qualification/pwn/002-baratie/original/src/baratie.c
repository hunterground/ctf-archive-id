#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

#define CART_CAP 10
#define N_ITEMS  6

// Economy knobs
static const unsigned long long WALLET = 100ULL;                 // fixed daily wallet
static const unsigned long long RESTAURANT_PRICE = 0xf00df00d; // only reachable via overflow

// Game state
static unsigned long long total_item = 0;
static unsigned long long cart[CART_CAP];
static const unsigned long long price[N_ITEMS] = {30ULL, 5ULL, 100ULL, 7ULL, 50ULL, 250ULL};
static const char *names[N_ITEMS] = {
    "Croissant", "Coffee", "Blue-fin Tuna", "Tea", "Meat", "Sea King Steak"
};

static unsigned long long bank = 0ULL; // hidden balance from “cashback” (bug target)

static void setup(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin,  NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

void win(void){
    system("/bin/sh");
}

static void win_banner(void){
    puts("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⠁⠀⢰⠋⢠⠞⠁⠀⢀⡞⠀⢀⣶⠟⠁⠀⠀⠀⠀⠀⠀⢻⣷⡀⠀⡟⡄⠀⢳⠀⠀⢧⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠁⠀⠀⡎⢠⠏⠀⠀⢀⡞⠀⢠⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣧⠀⢣⢱⠀⠘⡆⠀⠘⡆⠀⠀⠀⠀⠂⠀\n⢀⠀⠀⠀⠀⠀⡘⠀⢀⠇⠀⠀⢸⢡⠏⠀⠀⠀⡼⠀⢠⣿⠃⢀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠘⣿⡄⢸⡀⡇⠀⢹⡀⠀⢧⠀⠀⠀⠀⠀⠀\n⣀⣀⠀⠀⠀⢀⡇⠀⢸⠀⠀⠀⡆⡜⠀⠀⠀⣼⠃⢠⢧⢇⡔⠉⠀⠀⣧⠀⠀⠀⠀⠀⢀⠀⢹⣇⠀⡇⢸⠀⢸⡇⠀⢸⠀⠀⠀⠀⠀⠀\n⣿⣿⢸⠀⠀⢸⠀⠀⠀⠀⠀⢀⣿⠁⠀⠀⢰⡟⠀⠀⡞⢸⠀⡎⠉⢀⠇⠀⠀⣀⠴⠊⠁⠀⠀⢻⠀⡇⢨⠀⠀⡇⠀⠈⠀⠀⠀⠀⠀⡀\n⣿⣿⣿⠀⠀⠸⠀⠀⠀⠀⠀⠸⡿⠀⠀⠀⣾⡇⠀⢸⠁⠸⡀⠑⠒⠋⠀⣠⠚⠓⠒⠦⢤⡀⠀⠘⡆⢨⠀⠀⢰⡇⠀⠀⠀⠀⠀⠀⠀⠀\n⠉⠉⢹⠀⠀⡇⠀⠀⠀⠀⠀⠀⢣⠠⠀⠀⢻⠀⢀⡏⠀⠀⠑⠤⣠⣴⡿⠋⠉⠉⠉⠉⠲⣝⠦⠀⡇⣿⡀⠀⢸⡅⠀⢀⠀⠀⠀⠀⠀⠀\n⠀⠀⢸⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⢰⠀⠀⢸⠀⢸⡁⠀⠀⢀⣼⢧⡟⠀⠀⣤⣤⠀⠀⠀⠈⢇⠀⣿⠈⣇⠀⢸⠂⠀⡸⠀⠀⠀⠀⠀⠀\n⠀⠀⣸⡄⠀⣧⠀⠀⠀⠀⠀⠀⠀⢸⡀⠀⠸⡇⢸⣷⠀⠀⠙⠓⠻⡅⠀⠀⠛⠋⠀⠀⠀⠀⣈⣼⠏⠀⣿⠀⡌⡀⢀⠇⢰⠀⠀⠀⠀⠀\n⡀⠐⣿⣷⠀⠙⡄⠀⠀⠀⠀⠀⢂⠈⡇⠀⣰⣿⣿⡟⠀⠀⠀⠀⠀⠙⢄⡀⠀⠀⠀⢀⡠⢼⠿⠃⠀⠀⣿⢠⡇⠀⣼⡄⢸⣄⠀⠀⠀⠀\n⣿⣿⣿⣿⠳⡀⢡⠀⠀⢆⠀⠆⢸⡄⢹⡀⣸⣬⡏⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⣧⡞⡇⢰⢿⣷⡀⣿⠦⣄⠀⠀\n⢸⣿⣿⡇⠀⠱⡀⢇⠀⠘⡆⠀⢸⣇⣾⠳⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣼⡆⢀⡟⠀⣷⠇⣨⡟⠑⣿⣤⡏⣳⠧\n⣾⣿⣿⡇⠀⠀⢣⢸⡆⢠⣧⢰⣿⢻⠋⠀⠙⢾⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡠⠔⠊⠉⠀⠁⡇⠚⠀⢰⠏⠀⡅⣥⡾⠛⢉⣴⠃⠀\n⣿⣿⣿⠃⠀⠀⠀⢸⣧⣞⢸⣿⠇⠀⠙⡖⠤⠤⠭⠥⠤⠤⠤⠤⠤⠒⠒⠉⠉⠀⠀⠀⠀⠀⠀⣦⠇⠀⠀⠀⠀⢸⣿⠏⠠⣰⠟⠁⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠙⢻⣆⣿⡄⠀⠀⠘⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣠⣤⣶⣾⣿⡟⠀⠀⠀⠀⢀⣾⡟⠑⠚⣿⢠⡀⢸⣄\n⣿⣿⠟⠀⠀⠄⠀⠀⠀⠀⠙⠟⣹⡄⠀⠀⠹⣶⣶⣶⣶⣶⣶⣶⠶⠟⣋⣉⣥⣤⣀⡀⠉⠻⣿⠃⠀⠀⠀⢀⣼⡟⠀⠀⠀⣿⡟⢳⣼⣿\n⠋⠀⠀⠀⠀⠀⠀⠀⠊⠀⣀⠾⣿⣿⣄⠀⠀⢹⣿⣿⣿⡿⢋⣡⠖⠋⠁⠀⠀⠀⠀⠉⠳⡴⠃⠀⠀⠀⢀⣾⠏⠀⠀⠀⢀⣈⠀⠀⢻⣿\n⠀⠀⠀⠀⠀⠀⠀⣀⣴⣿⡅⠀⣹⣿⣿⣦⡤⠴⠛⣛⣿⡷⠋⠀⠀⠀⠀⠀⠀⠀⢀⣀⡴⠁⠀⠀⢀⣴⠟⠁⠀⢠⠇⢀⠎⠈⠳⣄⣾⡏\n⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣷⣶⠿⡟⣉⣤⣴⡊⠙⡅⠙⠓⠂⠀⠀⠀⠒⠒⠒⠈⣩⠞⠀⠀⢀⡴⠛⠁⠀⠀⢀⣾⠀⡼⠀⠀⠀⣼⡇⠀\n⡀⠀⠀⠀⣠⣴⣿⣿⣿⣿⠿⠿⠖⠛⠉⠁⠀⠙⣄⠈⠢⠤⣀⢀⣀⣀⣀⣀⠤⠚⠁⢀⣠⠞⠋⠀⠀⠀⠀⣠⢿⡿⣰⠁⠀⣠⡾⢛⣟⠛\n⢿⣦⡀⠶⠿⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢦⣠⣄⣴⣶⣶⣳⣶⣤⣾⠷⠚⠉⠀⠀⠀⠀⠀⠀⣠⠃⢸⡳⠃⢀⣴⠋⣹⣾⣿⣿\n⠓⠛⢟⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣴⡿⣩⣿⣿⣿⣿⣿⣿⣿⣿⠶⣄⠀⠀⠀⠀⠀⠀⠔⠁⠀⣿⣡⣶⣯⣤⣼⣿⣿⣿⣿\n");
}

static void banner(void){
    puts("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⢀⡴⠉⠀⠀⠀⣠⠞⠁⣠⠖⠋⠁⠀⠀⣠⠞⠁⠀⠀⢸⣷⣶⣦⠀⠀⣄⠙⢦⠀⠀⠙⢆⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⣠⠖⠋⠀⢀⠖⣠⠊⢀⡴⠋⠁⠀⠀⢀⣤⡾⠁⠀⣠⠆⠀⣸⣟⡉⠘⣧⡀⠈⢧⠈⢧⠀⠀⠈⢣⡀⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣩⠴⡾⠃⠀⠀⣴⠃⠀⠀⢠⠞⠀⠀⠀⠀⡠⢞⡟⠀⢀⡾⠁⡆⠀⣿⡏⠙⢦⢾⣷⡀⠈⣆⠈⢇⠰⡀⠀⠱⡀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⠁⠀⠀⡼⠁⠀⠀⣰⠏⠀⠀⠀⢀⡼⢁⡜⠀⢠⡟⠀⢀⠇⢀⣿⠁⠀⠀⢻⣿⣷⡄⠘⡄⠘⡆⠹⡀⠀⢹⡀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⣠⠂⣼⠁⠀⠀⢠⠇⠀⠀⠀⠀⡞⠀⡜⠁⣴⡟⠀⠀⣼⠀⣼⡏⠀⠀⠀⠀⢻⣿⡿⠀⢱⡀⠸⡄⢳⠀⠀⢧⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠁⢠⠃⢰⠃⠀⠀⢠⠏⠀⠀⠀⠀⡾⠀⢰⠃⢀⡟⠀⠀⢀⡏⢰⣿⠁⠀⠀⠀⠀⠀⢻⣽⡆⠈⣇⠀⢳⠘⡇⠀⠸⡄⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⢰⠃⠀⡜⠀⡜⠀⠀⢠⡏⠀⠀⣸⠁⣸⠀⠀⡟⢀⡼⠀⠀⠀⣸⠀⣼⠏⠀⠀⠀⠀⠀⠀⠀⢳⣷⠀⢹⠀⠘⡄⢱⠀⠀⠹⡀⠀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⡏⠀⢰⡇⠀⡇⠀⢠⣿⠁⠀⢰⠇⢠⠇⠀⢠⠇⣸⠃⠀⠀⢠⡇⣰⡟⠀⠀⣀⣀⠀⠀⠀⠀⠈⣿⡆⢸⡆⠀⣧⢸⡄⠀⠀⣧⡀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⢸⠁⠀⢸⠀⠀⡇⠀⣾⡟⠀⠀⡏⠀⡞⠀⠀⢸⢀⡇⠀⠀⠀⡾⢠⣿⢃⡴⠋⠀⠘⢦⠀⠀⠀⠀⠸⣷⢸⢇⠀⢹⠘⣷⠀⠀⣿⠹⡀⢸⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⡇⠀⠀⡇⢠⣻⠃⠀⢰⠃⢸⠁⠀⠀⢸⣿⠀⠀⠀⣰⠁⣬⠏⢸⠀⢚⣉⣡⠟⠀⠀⠀⢀⡤⣿⢠⢻⠀⢸⠀⣿⠀⠀⡏⠀⡇⢸⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⣯⠀⠀⡇⠀⠀⡇⢺⡏⠀⠀⢸⠀⡸⠀⠀⠀⣼⣿⠀⠀⢰⠏⣾⡟⠀⠘⢦⡈⠉⠁⢀⣠⣴⠞⠉⠀⢹⣼⠘⠇⢸⣴⣿⡄⠀⡇⢀⡇⢨⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⢸⡀⠀⢧⠀⢠⢷⣾⢰⠀⢀⡇⠀⡇⠀⠀⡄⢻⡇⠀⢠⠏⢠⡾⠁⠀⠀⣀⣽⣿⢿⡿⠟⠓⠒⠦⣄⢸⡿⡇⠀⣸⡿⠂⡇⠀⡇⢸⠁⣸⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⢣⡀⢸⡄⣾⣟⡇⣿⠀⢸⡇⢸⡇⠀⢰⠀⢸⠃⢠⡟⢰⣿⡁⠀⠀⠾⠿⠿⠟⠋⣀⣠⣤⣤⣀⠈⣿⠻⡇⡀⡟⠛⢰⡄⢸⡇⣾⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠈⢣⢸⣿⠛⣿⠁⣿⠀⢀⡇⠸⡇⠀⣼⠀⠸⣆⣾⡇⣼⡟⣷⠀⠀⠀⠀⠀⠐⠿⠿⠛⠉⠙⠛⢿⣇⣠⣧⢸⣿⠁⠀⣷⡈⣷⣇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣾⡏⠀⠾⡀⢹⡀⠘⡇⢻⡇⠀⣿⡄⠀⣿⣿⣗⣿⢀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣧⡟⣿⠀⠀⡟⢷⣿⣏⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⢳⠀⠀⢷⢸⡇⠀⠃⢸⡇⣠⣿⡇⢰⣿⣿⣿⡇⠨⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡇⣿⣆⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠚⠀⠸⡆⠀⠀⠈⣿⠀⠀⣼⣷⣿⣿⢇⣾⣿⢿⡿⣆⣸⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⣿⣷⣿⡿⢳⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣷⡞⣇⠀⢹⣇⣴⡿⢻⣿⣿⣾⠟⠁⠘⠇⠈⠻⢶⡠⠒⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣻⣿⣇⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠏⠀⣿⣠⣿⣿⢿⡇⠀⠙⠋⠁⠀⠀⠀⠀⠀⠀⠂⠙⠶⠜⠊⠛⠩⠋⣉⣠⡤⠀⠀⠀⠀⣼⡿⣯⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⠋⠘⣿⣆⠀⠀⠀⠐⠒⢢⣤⣤⠤⠴⠒⠒⠒⠒⠒⠒⠒⠚⠉⠉⠁⠀⠀⠀⢀⣼⠏⢰⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠿⣿⣦⡀⢀⡴⣚⡵⠚⠁⠀⣀⣀⠀⢀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⢠⣾⢿⣆⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⣩⠞⠉⠀⠀⠀⠀⠈⠉⢛⣟⠛⠉⠁⠀⠀⠀⠀⠀⢀⣴⢿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⠟⠉⠳⣄⡀⠀⠀⠀⣠⣀⣼⣿⠀⣠⡄⠀⠀⠀⢀⣴⡟⠁⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣠⣤⣼⡇⠀⠀⠈⠻⣦⣶⣤⣿⣷⣿⣿⣶⣿⣷⣴⣿⣴⠟⠋⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣾⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠙⠛⠿⠿⠿⠿⠿⠿⠛⠛⠛⠁⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡏⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⢾⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠁⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⠃⠈⠻⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⢞⡆⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡋\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣟⠁⠀⠀⠀⠈⠻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⣾⠁⠀⢀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇\n⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣀⠀⠀⠀⠈⠳⢦⣀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠀⢰⢇⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⠀⠀⠀⣀⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠉⠳⠦⣤⡤⠶⠟⠁⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿\n");
}

static void greet(void){
    banner();
    puts("<Sanji> : Welcome to Baratie, the one and only sea restaurant in East Blue!\n");
    printf("<Sanji> : House rule — every customer has exactly %llu berry today.\n\n", WALLET);
}

static void print_menu_items(void){
    puts("\n----------------------------");
    puts("|           MENU           |");
    puts("----------------------------");
    for (int i = 0; i < N_ITEMS; i++) {
        printf("|  %d. %-14s %4llu$ |\n", i + 1, names[i], price[i]);
    }
    puts("----------------------------\n");
}

static void print_actions(void){
    puts("\n------------- Actions -------------");
    puts("1) Order items");
    puts("2) Checkout");
    puts("3) Buy the restaurant");
    puts("4) Leave");
    puts("-----------------------------------");
    printf("<You> : ");
}

static void order(void){
    unsigned long long item = 0, n = 0;

    print_menu_items();
    puts("<Sanji> : What do you want to order? (1 - number on menu)\n");
    printf("<You> : ");
    if (scanf("%llu", &item) != 1) {
        puts("\n<Sanji> : Huh? Try again.\n");
        // flush
        int c; while ((c = getchar()) != '\n' && c != EOF) {}
        return;
    }

    if (item < 1 || item > (unsigned long long)N_ITEMS) {
        puts("\n<Sanji> : We don't have that here!\n");
        return;
    }

    if (total_item >= CART_CAP) {
        puts("\n<Sanji> : You sure you're gonna eat that all?!\n");
        return;
    }

    puts("\n<Sanji> : For how many people?\n");
    printf("<You> : ");
    if (scanf("%llu", &n) != 1) {
        puts("\n<Sanji> : Speak clearly, seaweed brain.\n");
        int c; while ((c = getchar()) != '\n' && c != EOF) {}
        return;
    }

    // Deliberately allow very large n (overflow bait)
    cart[total_item] = price[item - 1] * n; // unsigned overflow is defined (wrap)
    total_item++;
    puts("\n<Sanji> : Alright. Anything else?\n");
}

static void checkout(void){
    if (total_item == 0) {
        puts("\n<Sanji> : If you don't want to order anything just get out!\n");
        return;
    }

    // Intentional truncation: 32-bit bill accumulator (overflow target)
    unsigned int bill = 0U;
    for (unsigned long long i = 0; i < total_item; i++) {
        bill += (unsigned int)cart[i]; // truncation each add
    }

    printf("\n<Sanji> : Our bill shows: %u$\n\n", bill);
    printf("<Sanji> : Your wallet: %llu$\n\n", WALLET);

    // BUG: “cashback” calculated with unsigned wraparound when bill > WALLET
    // If bill <= WALLET => small positive bonus (<=100). Otherwise huge due to underflow.
    unsigned int bonus = (unsigned int)(WALLET - bill);
    bank += bonus;

    if (bill <= WALLET) {
        puts("<Sanji> : Alright! More berries! Nami will love this.\n");
    } else {
        puts("<Sanji> : Not enough berry. Come back when you can pay!\n");
    }

    // Clear cart after attempt (so farming small positives is impractical)
    for (unsigned long long i = 0; i < total_item; i++) cart[i] = 0ULL;
    total_item = 0ULL;
}

static void celebrate(void){
    char new_name[0x100];
    puts("\n<Sanji> : Now do you have any name for your new sea-restaurant?\n");
    printf("<You> : ");

    scanf("%255s", new_name);
    printf(new_name);

    puts("<Sanji> : I like the new name, now I'm gonna marry Nami with these berries...\n");
}

static void buy_restaurant(void){
    puts("\n<Sanji> : So you want to buy Baratie, huh?\n");
    printf("<Sanji> : Price is %llu berries.\n\n", RESTAURANT_PRICE);
    printf("<Sanji> : Your balance : %llu berries.\n\n", bank);

    if (bank == RESTAURANT_PRICE) {
        win_banner();
        puts("<Sanji> : ...\n");
        puts("<Sanji> : HOW COME YOU HAVE SO MUCH MONEY, NAMI SAN WILL BE VERY HAPPY!\n");
        puts("<Sanji> : The ship is yours... Will you change it name?\n");
        celebrate();
    } else if(bank < RESTAURANT_PRICE){
        puts("<Sanji> : Not enough. Keep eating like luffy!\n");
    } else {
        puts("<Sanji> : We don't receive tips in here!\n");
    }
}

int main(void){
    setup();
    greet();

    while (1) {
        print_actions();
        unsigned choice = 0;
        if (scanf("%u", &choice) != 1) {
            puts("\n<Sanji> : I didn't get that.\n");
            int c; while ((c = getchar()) != '\n' && c != EOF) {}
            continue;
        }

        switch (choice) {
            case 1:
                order();
                break;
            case 2:
                checkout();
                break;
            case 3:
                buy_restaurant();
                break;
            case 4:
                puts("\n<Sanji> : Come again!\n");
                exit(0);
            default:
                puts("\n<Sanji> : Sorry, you're not allowed to do that!\n");
        }
    }
    return 0;
}

