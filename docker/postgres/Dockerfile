FROM postgres:16-alpine

# Create directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy initialization script
COPY init-twenty.sql /docker-entrypoint-initdb.d/

# Set up health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-twenty}

# Expose PostgreSQL port
EXPOSE 5432

# Set default environment variables
ENV POSTGRES_DB=twenty
ENV POSTGRES_USER=postgres
ENV POSTGRES_HOST_AUTH_METHOD=md5

# Labels
LABEL org.opencontainers.image.source=https://github.com/kwt-dev/twenty
LABEL org.opencontainers.image.description="PostgreSQL 16 with pgvector extension for Twenty CRM"