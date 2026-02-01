---
description: Monitor and manage the Heady Task System
---
# Task System Monitoring Workflow

This workflow details how to monitor the real-time task management system, queues, and performance metrics.

1. **View Task Logs**
   Stream logs specifically for task execution and queue processing.
   ```powershell
   // turbo
   docker-compose logs -f ide | Select-String "Task"
   ```

2. **Check Queue Status (Redis)**
   Inspect the BullMQ/Redis queues directly.
   ```powershell
   docker-compose exec redis redis-cli keys "bull:*"
   ```

3. **Monitor System Metrics (API)**
   Query the internal health and metrics API.
   ```powershell
   curl http://localhost:3000/api/health
   ```

4. **Web Dashboard**
   Access the Heady Automation IDE dashboard to view the Task Activity screen.
   - URL: `http://localhost:3000`
   - Navigate to **Activity** or **Tasks** tab.

5. **Mobile Dashboard**
   Use the Mobile App for on-the-go monitoring.
   - Ensure the app is connected to the server.
   - Check the **Tasks** tab for queue status.
