#!/bin/bash
echo "Starting Online Shop Project..."

# Start Backend (Port ${PORT:-5001})
echo "Starting Backend..."
# Kill any process already listening on the backend port
if command -v lsof >/dev/null 2>&1; then
  PORT=${PORT:-5001}
  PIDS=$(lsof -i TCP:${PORT} -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Killing existing process(es) on port $PORT: $PIDS"
    kill -9 $PIDS
  fi
fi
(cd online-shop-backend && npm start) &
BACKEND_PID=$!
echo "Backend process launched with PID: $BACKEND_PID"

# Start Frontend
echo "Starting Frontend..."
(cd online-shop-frontend && npm start) &
FRONTEND_PID=$!
echo "Frontend process launched with PID: $FRONTEND_PID"

echo "Application is running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000 (usually)"
echo "Press Ctrl+C to stop all."

wait
