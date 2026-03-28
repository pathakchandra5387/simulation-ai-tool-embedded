# Use official, highly-optimized Nginx Alpine image
FROM nginx:alpine

# Remove default nginx HTML files to ensure a clean slate
RUN rm -rf /usr/share/nginx/html/*

# Copy the IntentBridge application files directly into the Nginx serving directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Expose port 80 (required by Google Cloud Run)
EXPOSE 80

# Start Nginx in the foreground to keep the Docker container alive
CMD ["nginx", "-g", "daemon off;"]
