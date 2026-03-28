# Use official, highly-optimized Nginx Alpine image
FROM nginx:alpine

# Remove default nginx HTML files to ensure a clean slate
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom configuration that listens on Cloud Run's required Port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the IntentBridge application files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Expose Port 8080 as expected by Google Cloud Run
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
