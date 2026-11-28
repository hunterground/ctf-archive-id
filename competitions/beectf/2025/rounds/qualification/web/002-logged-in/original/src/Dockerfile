FROM php:8.2-apache

RUN a2enmod rewrite
WORKDIR /var/www

COPY webapp/public/ public/
COPY webapp/documents/ documents/
COPY webapp/src/ src/
COPY webapp/storage/ storage/
COPY webapp/config/php.ini /usr/local/etc/php/conf.d/z-challenge.ini
COPY webapp/config/vhost.conf /etc/apache2/sites-available/000-default.conf
COPY webapp/flag.txt flag.txt

RUN set -eux; \
    chown -R root:root /var/www; \
    chmod -R u=rwX,go=rX /var/www; \
    \
    mkdir -p /var/www/storage/logs /var/log/apache2; \
    : > /var/www/storage/logs/app.log; \
    chown -R www-data:www-data /var/www/storage /var/log/apache2; \
    chmod -R u+rwX,go-rwX /var/www/storage; \
    \
    chown root:root /var/www/flag.txt; \
    chmod 444 /var/www/flag.txt


COPY webapp/clear_log.sh /clear_log.sh
COPY webapp/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh /clear_log.sh && chmod +x /entrypoint.sh /clear_log.sh

EXPOSE 80
CMD ["/entrypoint.sh"]
