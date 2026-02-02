import { createContextClient } from '@heady/core-domain';

// Singleton instance of the MCP Context Client
export const mcpClient = createContextClient('web-heady-connection', {
  autoRegister: true,
  heartbeatInterval: 30000,
});

if (process.env.NODE_ENV !== 'production') {
    process.on('SIGINT', () => {
        mcpClient.destroy();
        process.exit();
    });
}
