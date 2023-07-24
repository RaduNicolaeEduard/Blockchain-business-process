FROM python:3.11
WORKDIR /app
RUN apt update && apt install -y libpq-dev gcc libgirepository1.0-dev 
ADD requirements.txt /app
RUN pip install -r requirements.txt
COPY . /app
CMD ["python", "app.py"]
