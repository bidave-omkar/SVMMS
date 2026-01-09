// src/models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "password_hash"
  }, role: {
    type: DataTypes.ENUM("user", "service_center", "admin"),
    defaultValue: "user"
  }
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "createdat",
  updatedAt: "updatedat",
});

export default User;