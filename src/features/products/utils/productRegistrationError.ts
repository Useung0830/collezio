export class ProductRegistrationError extends Error {
  readonly isAwaitingConfirmation: boolean;

  constructor(message: string, isAwaitingConfirmation = false) {
    super(message);
    this.name = "ProductRegistrationError";
    this.isAwaitingConfirmation = isAwaitingConfirmation;
  }
}
