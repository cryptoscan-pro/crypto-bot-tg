export interface WebSocketConfig {
  id: string;
  query: Record<string, string | number>;
  destination: {
    type: 'private' | 'channel';
    id: string;
  };
  isActive: boolean;
  name: string;
}
