#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

char problems[0x1000] = "this is the problems";
char ticket[0x30];

__attribute__((optimize("omit-frame-pointer")))
void init()
{
    setvbuf(stdin, 0, 2, 0);
    setvbuf(stdout, 0, 2, 0);
    setvbuf(stderr, 0, 2, 0);
}

void vuln(void){
    char problem[60];
    system("printf '\\n\\033[1;36m==================================================\\033[0m\\n'");
    system("printf '\\033[1;97m\\033[44m   🤝  CUSTOMER SERVICE CONSOLE   \\033[0m\\n'");
    system("printf '\\033[1;36m==================================================\\033[0m\\n\\n'");
    system("printf '\\033[1;93m[1/2]\\033[0m \\033[1;92mVerifikasi Pelanggan\\033[0m\\n'");
    system("printf '👤  Masukkan data pelanggan ringkas (\\033[1;97m maks 47 byte \\033[0m)\\n'");
    system("printf '    Format saran: \\033[1;96mID|Nama|Ticket#\\033[0m  (cth: 12873|Rina|T-0042)\\n'");
    system("printf '\\033[2;37mTips: Gunakan karakter ASCII biasa agar mudah diproses.\\033[0m\\n'");
    system("printf '\\033[1;90m> \\033[0m'");
    read(0, ticket, sizeof(ticket) - 1);
    system("printf '\\n\\033[2;37m----------------------------------------------\\033[0m\\n'");
    system("printf '\\033[1;93m[2/2]\\033[0m \\033[1;92mBuat/Perbarui Tiket\\033[0m\\n'");
    system("printf '📝  Tulis deskripsi masalah / catatan agent (\\033[1;97m maks 96 byte \\033[0m)\\n'");
    system("printf '    Sertakan: gejala, langkah yang sudah dicoba, dan prioritas.\\n'");
    system("printf '\\033[1;90m>> \\033[0m'");
    read(0, problem, 0x60);
    system("printf '\\n\\033[2;37m----------------------------------------------\\033[0m\\n'");
    system("printf '✅  \\033[1;92mTiket dicatat. Tim kami akan menindaklanjuti.\\033[0m\\n\\n'");
}

int main(void){
    init();
    vuln();
    return 0;
}
