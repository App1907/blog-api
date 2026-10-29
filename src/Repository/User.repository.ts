import { Types } from "mongoose";
import { User, IUser } from "../model/User.model";

export class UserRepository {
  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<IUser> {
    return User.create(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  async findById(id: Types.ObjectId | string): Promise<IUser | null> {
    return User.findById(id);
  }

  async updateName(
    id: Types.ObjectId | string,
    name: string
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}
