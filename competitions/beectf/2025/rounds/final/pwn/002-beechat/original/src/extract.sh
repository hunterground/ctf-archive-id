docker system prune
docker build -t chall-builder .
docker create --name temp-container chall-builder
docker cp temp-container:/app/chall .
docker cp temp-container:/lib/x86_64-linux-gnu/libc-2.27.so .
docker cp temp-container:/lib/x86_64-linux-gnu/ld-2.27.so .
docker rm temp-container

mv libc-2.27.so libc.so.6
mv ld-2.27.so ld-linux-x86-64.so.2
