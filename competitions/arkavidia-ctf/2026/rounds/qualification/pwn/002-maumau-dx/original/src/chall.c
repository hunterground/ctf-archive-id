#define _GNU_SOURCE
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

struct game_data {
    unsigned long random;
    char name[50];
    unsigned char scores[6][4];
};

void print_menu(int attempt)
{
    puts("\n===========================================");
    puts("=        Selamat datang di Maumau!        =");
    printf("=   Kamu memiliki %d kesempatan tersisa,   =\n", attempt);
    puts("=   Pilih salah satu lagu di bawah ini!   =");
    puts("=                                         =");
    puts("= 1. Oshama Acak                          =");
    puts("= 2. Garakuta Permainan Boneka            =");
    puts("= 3. Kerajaan Laten                       =");
    puts("= 4. Kesepian Akhir Dunia                 =");
    puts("= 5. Ledakan Surgawi                      =");
    puts("= 6. Penjelajah IByte                     =");
    puts("===========================================\n");
    return;
}

float score_counter(unsigned char scores[4]){
    int total_score = (scores[0] + scores[1] + scores[2] + scores[3]) * 10;
    int current_score = 10 * scores[0] + 8 * scores[1] + 4 * scores[2];
    if(!total_score) return 0;
    return 101 * current_score / total_score;
}

char *grade(float score){
    if(score >= 100.5) return "SSS+";
    if(score >= 100.0) return "SSS";
    if(score >= 99.5) return "SS+";
    if(score >= 99.0) return "SS";
    if(score >= 98.0) return "S+";
    if(score >= 97.0) return "S";
    if(score >= 94.0) return "AAA";
    if(score >= 90.0) return "AA";
    if(score >= 80.0) return "A";
    if(score >= 75.0) return "BBB";
    if(score >= 70.0) return "BB";
    if(score >= 60.0) return "B";
    if(score >= 50.0) return "C";
    if(score >= 0) return "D";
    return "Skor invalid";
}

void game(unsigned char scores[][4]){
    int attempt = 4;
    for(int i = 0; i < attempt; i++){
        int current = 0;
        int safe_index, note;
        while(current < 5){
            switch(current){
                case 0:
                    print_menu(attempt-i);
                    printf(">> ");
                    char index[16];
                    scanf("%15s", index);
                    if (strchr(index, '-')) {
                        puts("Nakal kamu yah >:( GET OUT!!");
                        exit(1);
                    }
                    safe_index = atoi(index) - 1;

                    if(safe_index > 5){
                        puts("Nakal kamu yah >:( GET OUT!!");
                        exit(1);
                    }
                    puts("");
                    puts("===========================================");
                    puts("Masukkan akurasi setiap not yang kamu dapat!");
                    puts("disclaimer: mesin ini masih sangat sederhana >__< kalo bisa inputnya di bawah 256 yah");
                    break;
                case 1:
                    printf(">> Perfect: "); break;       
                case 2:
                    printf(">> Great: "); break;
                case 3:
                    printf(">> Good: "); break;
                case 4:
                    printf(">> Miss: "); break;
                default:
                    exit(1);
            }
            if(current){
                scanf("%d", &note);
                if(note > 255 | note < 0){
                    printf("Jumlah not melewati batas :(");
                    exit(1);
                }
                scores[safe_index][current - 1] = (unsigned char) note;
            }
            current++;
        }
        puts("===========================================");
        float chart_score = score_counter(scores[safe_index]);
        printf("Skor yang kamu dapatkan: %.4f%%\n", chart_score);
        printf("Grade akurasimu: %s\n", grade(chart_score));
        puts("===========================================");
    }
}

int main(){
    setbuf(stdin, null)
    setbuf(stdout, null)
    struct game_data data;
    memset(data.scores, 0, sizeof(data.scores));;
    printf("Masukkan namamu: ");
    scanf("%49s", data.name);
    for (int i = 0; i < strlen(data.name); i++) {
        if (data.name[i] < 0x20 || data.name[i] > 0x7e){
            puts("Tuan, saya yakin itu bukan nama anda");
            exit(1);
        }
    } printf("Selamat datang di Maumau DX, %s!", data.name);
    srand(time(NULL));
    data.random = rand();
    data.random = (data.random << 32) | rand();
    game(data.scores);

    if(data.random >> 32 == 0xabad0bee){
        printf("[v] Selamat! Kamu salah satu orang beruntung yang bisa melihat pesan ini!\nIni hadiah kecil untuk kamu: %p\n", (void *)&data.random);
        if((data.random & 0xffffffff) == 0xbeabad0b){
            puts("[v] Kamu dapat kesempatan untuk main sekali lagi!");
            game(data.scores);
        }
    }
    puts("Terima kasih telah bermain!");
    exit(0);
}
