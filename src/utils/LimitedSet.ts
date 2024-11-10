export class LimitedSet<T> {
    private elements: T[];
    private limit: number;

    constructor(limit: number) {
        this.limit = limit;
        this.elements = [];
    }

    add(item: T): void {
        if (this.elements.length >= this.limit) {
            this.elements.shift();
        }
        this.elements.push(item);
    }

    remove(item: T): void {
        const index = this.elements.indexOf(item);
        if (index !== -1) {
            this.elements.splice(index, 1);
        } else {
            throw new Error(`Item ${item} not found in set.`);
        }
    }

    has(item: T): boolean {
        return this.elements.includes(item);
    }

    size(): number {
        return this.elements.length;
    }

    toArray(): T[] {
        return [...this.elements];
    }

    toString(): string {
        return `LimitedSet(${this.elements})`;
    }
}

