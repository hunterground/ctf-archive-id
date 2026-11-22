FROM python:3.12-slim

RUN apt update && apt install -y gcc build-essential

RUN adduser --disabled-password --uid 1000 --shell /bin/bash ctf
RUN mkdir /home/ctf/chall

RUN chown -R root:root /home/ctf/chall
RUN chmod -R 555 /home/ctf/chall

WORKDIR /home/ctf/chall

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

RUN mkdir -p app/management/commands app/migrations app/static app/templates CrappyPolls

COPY app/management/*.py            app/management
COPY app/management/commands/*.py   app/management/commands
COPY app/migrations/__init__.py     app/migrations/
COPY app/static/                    app/static
COPY app/templates/                 app/templates
COPY app/*.py                       app
COPY CrappyPolls/*.py               CrappyPolls
COPY *.py                           .
COPY entrypoint.sh                  .

RUN chown ctf:ctf . app/migrations entrypoint.sh
RUN chmod 755 . app/migrations
RUN chmod 544 entrypoint.sh

USER ctf

ENTRYPOINT ["./entrypoint.sh"]
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8137"]