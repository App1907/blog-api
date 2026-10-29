import { Types } from "mongoose";
import { AppError } from "./AppError";
import { Messages } from "../constants/messages";

export class ObjectIdHelper {
  static assert(id: string): Types.ObjectId {
    const normalized = id.trim().toLowerCase();
    if (
      !Types.ObjectId.isValid(normalized) ||
      String(new Types.ObjectId(normalized)) !== normalized
    ) {
      throw new AppError(Messages.INVALID_OBJECT_ID, 400);
    }
    return new Types.ObjectId(normalized);
  }

  static isValid(id: string): boolean {
    const normalized = id.trim().toLowerCase();
    return (
      Types.ObjectId.isValid(normalized) &&
      String(new Types.ObjectId(normalized)) === normalized
    );
  }
}
