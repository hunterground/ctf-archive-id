FROM python:3.10-slim

WORKDIR /app

COPY samurailove/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

COPY samurailove .

EXPOSE 4433

CMD ["python", "app.py"]