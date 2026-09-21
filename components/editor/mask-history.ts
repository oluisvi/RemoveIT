export class MaskHistory<T> {
  private entries: T[] = [];
  constructor(private readonly limit = 20) {}
  push(value: T) { this.entries.push(value); if (this.entries.length > this.limit) this.entries.shift(); }
  undo() { return this.entries.pop(); }
}
