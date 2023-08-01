FROM python:3.11
WORKDIR /srv/flask_app
RUN apt-get clean \
    && apt-get -y update

RUN apt-get -y install nginx \
    && apt-get -y install python3-dev \
    && apt-get -y install build-essential \
    && apt-get -y install libcairo2-dev \
    && apt-get -y install libgirepository1.0-dev \
    && apt-get -y install poppler-utils \
    && apt-get -y install openssl
COPY requirements.txt /srv/flask_app/
RUN pip install -r requirements.txt --src /usr/local/src
COPY . /srv/flask_app
COPY nginx.conf /etc/nginx
RUN chmod +x ./start.sh

CMD ["./start.sh"]