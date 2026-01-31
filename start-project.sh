#!/bin/bash
echo "Starting Online Shop Project..."

# Start Backend (Port 5001)
echo "Starting Backend..."
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
