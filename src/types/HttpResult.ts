export interface HttpResult {
  start: (id: string, query: Record<string, string>) => void;
  stop: (id: string) => void;
  listen: (id: string, onData: (data: any) => void) => void;
}
