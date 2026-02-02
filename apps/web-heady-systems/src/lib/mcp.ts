import { createContextClient } from '@heady/core-domain';

// Singleton instance of the MCP Context Client
// We use the 'web-heady-systems' service name to identify this client
export const mcpClient = createContextClient('web-heady-systems', {
  autoRegister: true,
  heartbeatInterval: 30000,
});

// Ensure we clean up on process exit
if (process.env.NODE_ENV !== 'production') {
    process.on('SIGINT', () => {
        mcpClient.destroy();
        process.exit();
    });
}
