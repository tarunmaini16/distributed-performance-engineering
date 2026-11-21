
FROM grafana/k6:2.4.0

WORKDIR /work

COPY config/ ./config/
COPY utils/ ./utils/
COPY data/ ./data/
COPY journeys/ ./journeys/
COPY metrics/ ./metrics/
COPY tests/ ./tests/
