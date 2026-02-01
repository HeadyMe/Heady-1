import { TaskSystem, TaskExecutor, TaskPriority } from '../src/index.js';

// Create and configure the task system
const taskSystem = new TaskSystem({
  server: {
    port: 8080,
    host: 'localhost'
  },
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 5,
    maxRetries: 3,
    retryDelay: 5000
  },
  database: {
    connectionString: process.env.DATABASE_URL || 
      'postgresql://heady:password@localhost:5432/task_manager'
  },
  monitoring: {
    enabled: true,
    interval: 10000
  },
  websocket: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  }
});

// Custom task executor for image processing
const imageProcessor: TaskExecutor = {
  type: 'image-process',
  async execute(payload: { imageUrl: string; operations: string[] }, task) {
    console.log(`Processing image: ${payload.imageUrl}`);
    
    // Simulate processing steps
    for (let i = 0; i < payload.operations.length; i++) {
      const operation = payload.operations[i];
      console.log(`  Applying: ${operation}`);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update progress
      const progress = ((i + 1) / payload.operations.length) * 100;
      if (task.onProgress) {
        task.onProgress(progress, task);
      }
    }
    
    return {
      success: true,
      processedUrl: `${payload.imageUrl}_processed.jpg`,
      operations: payload.operations
    };
  },
  
  async validate(payload) {
    return !!(payload.imageUrl && Array.isArray(payload.operations));
  }
};

// Custom task executor for sending emails
const emailSender: TaskExecutor = {
  type: 'send-email',
  async execute(payload: { to: string; subject: string; body: string }) {
    console.log(`Sending email to: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      sentAt: new Date()
    };
  }
};

// Custom task executor for data aggregation
const dataAggregator: TaskExecutor = {
  type: 'aggregate-data',
  async execute(payload: { sources: string[]; aggregationType: string }) {
    console.log(`Aggregating data from ${payload.sources.length} sources`);
    
    const results = [];
    for (const source of payload.sources) {
      console.log(`  Fetching from: ${source}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      results.push({
        source,
        data: Math.random() * 100
      });
    }
    
    const aggregated = results.reduce((sum, r) => sum + r.data, 0);
    
    return {
      sources: payload.sources,
      aggregationType: payload.aggregationType,
      result: aggregated,
      timestamp: new Date()
    };
  }
};

// Start the system
async function main() {
  try {
    console.log('🚀 Starting Task Management System...');
    
    // Start the task system
    await taskSystem.start();
    
    // Get the task manager instance
    const taskManager = taskSystem.getTaskManager();
    
    // Register custom executors
    taskManager.registerExecutor(imageProcessor);
    taskManager.registerExecutor(emailSender);
    taskManager.registerExecutor(dataAggregator);
    
    console.log('✅ Task system started successfully');
    console.log(`📡 WebSocket server: ws://localhost:8080`);
    console.log(`🌐 REST API: http://localhost:8080/api`);
    console.log(`📊 Dashboard: http://localhost:8080`);
    
    // Example: Create various tasks
    
    // 1. Simple echo task
    const echoTask = await taskManager.createTask({
      name: 'Echo Test',
      type: 'echo',
      priority: TaskPriority.NORMAL,
      payload: { message: 'Hello, Task Manager!' }
    });
    console.log(`Created echo task: ${echoTask.id}`);
    
    // 2. Image processing task
    const imageTask = await taskManager.createTask({
      name: 'Process Profile Image',
      type: 'image-process',
      priority: TaskPriority.HIGH,
      payload: {
        imageUrl: 'https://example.com/profile.jpg',
        operations: ['resize', 'crop', 'optimize', 'watermark']
      }
    });
    console.log(`Created image task: ${imageTask.id}`);
    
    // 3. Email task (scheduled for later)
    const emailTask = await taskManager.createTask({
      name: 'Send Welcome Email',
      type: 'send-email',
      priority: TaskPriority.NORMAL,
      payload: {
        to: 'user@example.com',
        subject: 'Welcome to Task Manager',
        body: 'Thank you for using our task management system!'
      },
      scheduledFor: new Date(Date.now() + 60000) // 1 minute from now
    });
    console.log(`Created scheduled email task: ${emailTask.id}`);
    
    // 4. Data aggregation task with child tasks
    const parentTask = await taskManager.createTask({
      name: 'Aggregate Monthly Data',
      type: 'aggregate-data',
      priority: TaskPriority.LOW,
      payload: {
        sources: ['api1', 'api2', 'api3', 'api4'],
        aggregationType: 'sum'
      }
    });
    
    // Create child tasks for detailed processing
    for (let i = 1; i <= 3; i++) {
      const childTask = await taskManager.createChildTask(parentTask.id, {
        name: `Process Dataset ${i}`,
        type: 'echo',
        priority: TaskPriority.LOW,
        payload: { dataset: `dataset_${i}` }
      });
      console.log(`Created child task: ${childTask.id}`);
    }
    
    // Monitor task events
    taskManager.on('task:completed', (task) => {
      console.log(`✅ Task completed: ${task.name} (${task.id})`);
    });
    
    taskManager.on('task:failed', (task) => {
      console.log(`❌ Task failed: ${task.name} (${task.id})`);
    });
    
    // Periodically check system metrics
    setInterval(async () => {
      const metrics = await taskManager.getMetrics();
      console.log('\n📊 System Metrics:');
      console.log(`  Queue: ${JSON.stringify(metrics.queue)}`);
      console.log(`  Database: Total tasks: ${metrics.database.total}`);
      if (metrics.websocket) {
        console.log(`  WebSocket: ${metrics.websocket.connections} connections`);
      }
    }, 30000);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⏹️  Shutting down task system...');
      await taskSystem.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start task system:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { taskSystem, main };
