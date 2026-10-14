export class CommunityPostSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunityPostSaveError";
  }
}
