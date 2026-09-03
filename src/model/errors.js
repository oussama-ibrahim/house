export class SpecError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SpecError';
  }
}
