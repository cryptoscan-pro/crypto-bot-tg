import { hello } from './hello';

describe('hello', () => {


it('should log "Hello, world!" to the console when hello() is called', () => {
const consoleSpy = jest.spyOn(console, 'log');
hello();
expect(consoleSpy).toHaveBeenCalledWith('Hello, world!');
consoleSpy.mockRestore();
});
});
