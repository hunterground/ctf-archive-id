#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <limits.h>
#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#define UPLOAD_DIR "uploads"
#define MAX_CONTENT_LEN 4096

static void setup(void);
static char *read_line(const char *prompt);
static int read_int(const char *prompt);
static int valid_name(const char *s);
static int build_path(char *out, size_t out_sz, const char *name);
static void list_files(void);
static void create_file(void);
static void view_file(void);
static void edit_file(void);
static void rename_file_menu(void);
static void delete_file_menu(void);
static void hash_file_menu(char hashes[][10], int n);

int main(void)
{
    setup();

    char hashes[][10] = {"md5sum", "sha256sum"};
    char n_hashes = 2;

    for (;;)
    {
        puts("\n== Simple Upload Manager ==");
        puts("1. Create file");
        puts("2. View file");
        puts("3. Edit file");
        puts("4. Rename file");
        puts("5. Delete file");
        puts("6. Show hash of file");
        puts("7. List uploaded files");
        puts("0. Exit");

        int choice = read_int("Choice: ");
        if (choice < 0)
        {
            puts("Input error, exiting.");
            break;
        }

        switch (choice)
        {
        case 1:
            create_file();
            break;
        case 2:
            view_file();
            break;
        case 3:
            edit_file();
            break;
        case 4:
            rename_file_menu();
            break;
        case 5:
            delete_file_menu();
            break;
        case 6:
            hash_file_menu(hashes, n_hashes);
            break;
        case 7:
            list_files();
            break;
        case 0:
            puts("Bye.");
            return 0;
        default:
            puts("Unknown choice.");
            break;
        }
    }

    return 0;
}

static void setup(void)
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);

    struct stat st;
    if (stat(UPLOAD_DIR, &st) == -1)
    {
        if (mkdir(UPLOAD_DIR, 0700) == -1)
        {
            perror("mkdir uploads");
            exit(EXIT_FAILURE);
        }
    }
}

static char *read_line(const char *prompt)
{
    int c;
    char *line = NULL;

    printf("%s", prompt);
    scanf("%ms%*c", &line);

    return line;
}

static int read_int(const char *prompt)
{
    int c;
    int num = 0;

    printf("%s", prompt);
    scanf("%d%*c", &num);

    return num;
}

static int valid_name(const char *s)
{
    if (!s || !*s || (strcmp(s, "..") == 0))
        return 0;

    for (const unsigned char *p = (const unsigned char *)s; *p; ++p)
    {
        if (!((*p >= 'a' && *p <= 'z') ||
              (*p >= 'A' && *p <= 'Z') ||
              (*p >= '0' && *p <= '9') ||
              *p == '_' || *p == '-' || *p == '.'))
        {
            return 0;
        }
    }
    return 1;
}

static int build_path(char *out, size_t out_sz, const char *name)
{
    int n = snprintf(out, out_sz, "%s/%s", UPLOAD_DIR, name);
    if (n < 0 || (size_t)n >= out_sz)
    {
        fprintf(stderr, "Path too long\n");
        return -1;
    }
    return 0;
}

static void list_files(void)
{
    DIR *dir = opendir(UPLOAD_DIR);
    if (!dir)
    {
        perror("opendir");
        return;
    }

    puts("\nUploaded files:");
    struct dirent *de;
    int any = 0;
    while ((de = readdir(dir)) != NULL)
    {
        if (strcmp(de->d_name, ".") == 0 || strcmp(de->d_name, "..") == 0)
            continue;
        printf(" - %s\n", de->d_name);
        any = 1;
    }
    if (!any)
    {
        puts(" (none)");
    }
    closedir(dir);
}

static size_t read_content(char **out_buf, size_t max_len)
{
    char *buf = malloc(max_len + 1);
    if (!buf)
    {
        perror("malloc");
        return 0;
    }

    printf("Enter content (max %zu characters):\n", max_len);
    if (!fgets(buf, (int)max_len + 1, stdin))
    {
        free(buf);
        puts("Failed to read content.");
        return 0;
    }

    size_t len = strlen(buf);
    if (len && buf[len - 1] == '\n')
    {
        buf[len - 1] = '\0';
        len--;
    }
    else
    {
        /* discard rest of line if user typed more than max_len */
        int c;
        while ((c = getchar()) != '\n' && c != EOF)
            ;
    }

    *out_buf = buf;
    return len;
}

static void create_file(void)
{
    char *name = read_line("New file name: ");
    if (!valid_name(name))
    {
        free(name);
        puts("Invalid file name (allowed: A-Z, a-z, 0-9, '_', '-', '.').");
        return;
    }

    int len_hint = read_int("Content length (max 4096): ");
    if (len_hint <= 0 || len_hint > MAX_CONTENT_LEN)
    {
        free(name);
        puts("Invalid length.");
        return;
    }

    char path[PATH_MAX];
    if (build_path(path, sizeof(path), name) != 0)
    {
        free(name);
        return;
    }

    char *buf = NULL;
    size_t actual_len = read_content(&buf, (size_t)len_hint);
    if (!actual_len && (!buf || buf[0] == '\0'))
    {
        free(name);
        free(buf);
        puts("No content entered.");
        return;
    }

    FILE *f = fopen(path, "w");
    if (!f)
    {
        free(name);
        free(buf);
        perror("fopen");
        return;
    }

    if (fwrite(buf, 1, actual_len, f) != actual_len)
    {
        perror("fwrite");
    }
    else
    {
        puts("File created.");
    }

    fclose(f);
    free(name);
    free(buf);
}

static void view_file(void) {
    char *name = read_line("File to view: ");
    if (!valid_name(name))
    {
        free(name);
        puts("Invalid file name.");
        return;
    }

    char path[PATH_MAX];
    if (build_path(path, sizeof(path), name) != 0)
    {
        free(name);
        return;
    }

    FILE *f = fopen(path, "r");
    if (!f) {
        perror("fopen");
        free(name);
        return;
    }

    char buf[MAX_CONTENT_LEN+1];
    struct stat st;
    stat(path, &st);
    fread(buf, sizeof(char), st.st_size, f);

    puts("Content:");
    puts(buf);
}

static void edit_file(void)
{
    char *name = read_line("File to edit: ");
    if (!valid_name(name))
    {
        free(name);
        puts("Invalid file name.");
        return;
    }

    char path[PATH_MAX];
    if (build_path(path, sizeof(path), name) != 0)
    {
        free(name);
        return;
    }

    int len_hint = read_int("New content length (max 4096): ");
    if (len_hint <= 0 || len_hint > MAX_CONTENT_LEN)
    {
        free(name);
        puts("Invalid length.");
        return;
    }

    char *buf = NULL;
    size_t actual_len = read_content(&buf, (size_t)len_hint);
    if (!actual_len && (!buf || buf[0] == '\0'))
    {
        free(name);
        free(buf);
        puts("No content entered.");
        return;
    }

    FILE *f = fopen(path, "w");
    if (!f)
    {
        perror("fopen");
        free(name);
        free(buf);
        return;
    }

    if (fwrite(buf, 1, actual_len, f) != actual_len)
    {
        perror("fwrite");
    }
    else
    {
        puts("File updated.");
    }

    fclose(f);
    free(name);
    free(buf);
}

static void rename_file_menu(void)
{
    char *oldname = read_line("Old file name: ");
    char *newname = read_line("New file name: ");

    if (!valid_name(oldname) || !valid_name(newname))
    {
        free(oldname);
        free(newname);
        puts("Invalid file name(s).");
        return;
    }

    char oldpath[PATH_MAX], newpath[PATH_MAX];
    if ((build_path(oldpath, sizeof(oldpath), oldname) != 0) || (build_path(newpath, sizeof(newpath), newname) != 0))
    {
        free(oldname);
        free(newname);
        return;
    }

    if (rename(oldpath, newpath) == 0)
    {
        puts("File renamed.");
    }
    else
    {
        perror("rename");
    }

    free(oldname);
    free(newname);
}

static void delete_file_menu(void)
{
    char *name = read_line("File to delete: ");
    if (!valid_name(name))
    {
        free(name);
        puts("Invalid file name.");
        return;
    }

    char path[PATH_MAX];
    if (build_path(path, sizeof(path), name) != 0)
    {
        free(name);
        return;
    }

    if (remove(path) == 0)
    {
        puts("File deleted.");
    }
    else
    {
        perror("remove");
    }
}

static void hash_file_menu(char hashes[][10], int n)
{
    puts("Available hashes:");
    for (int i = 0; i < n; i++)
    {
        printf("  %d. %s\n", i + 1, hashes[i]);
    }
    int i = read_int("Choose hash: ") - 1;
    if (i < 0 || i >= n)
    {
        puts("Invalid hash.");
        return;
    }

    char *name = read_line("File name: ");
    if (!valid_name(name))
    {
        free(name);
        puts("Invalid file name.");
        return;
    }

    char cmd[PATH_MAX + 32];
    cmd[snprintf(cmd, sizeof(cmd), "cd %s && %s -- %s", UPLOAD_DIR, hashes[i], name)] = '\0';

    system(cmd);

    free(name);
}
