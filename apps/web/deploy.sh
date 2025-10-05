npm run build
docker rm ems_frontend -f 

docker run -d -p 80:80 --name ems_frontend \
  -v ./dist:/usr/share/nginx/html:ro \
  -v ./nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  --restart unless-stopped \
  nginx
