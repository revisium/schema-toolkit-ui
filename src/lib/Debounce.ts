export class Debounce {
  private _timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly _delay: number) {}

  schedule(fn: () => void): void {
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._timer = setTimeout(fn, this._delay);
  }

  dispose(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
