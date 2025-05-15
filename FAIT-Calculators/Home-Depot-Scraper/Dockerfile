FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory with proper permissions
RUN mkdir -p /app/data/raw /app/data/results /app/data/lowes/raw /app/data/lowes/results && \
    chmod -R 777 /app/data

# Create a non-root user to run the application
RUN useradd -m appuser
USER appuser

# Environment variables (non-sensitive)
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV FLASK_ENV=production

# Expose the port
EXPOSE 8080

# Command to run the application
CMD ["python", "run.py"]