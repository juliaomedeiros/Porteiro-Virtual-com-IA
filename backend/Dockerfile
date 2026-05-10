FROM python:3.11-slim

WORKDIR /app

# Install dependencies for pg_isready and healthchecks
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Temporary: just a placeholder until T004
CMD ["python", "-m", "http.server", "8000"]
