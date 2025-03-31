FROM nginx:alpine
RUN chmod -R 777 /usr/share/nginx/html
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 6060