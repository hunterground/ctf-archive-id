FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY app.py ./

EXPOSE 21341

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "21341"]
