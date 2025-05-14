FROM nginx:alpine

# Copy the static website files to the nginx html directory
COPY . /usr/share/nginx/html

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Update nginx configuration to listen on port 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
