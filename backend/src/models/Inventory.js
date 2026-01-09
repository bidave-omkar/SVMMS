// SVMMS\backend\src\models\Inventory.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Inventory = sequelize.define(
  "Inventory",
  {
    part_name: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    stock: {
      type: DataTypes.INTEGER,
    },
    price: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: "inventory",   // VERY IMPORTANT
    timestamps: true,         // matches created_at, updated_at
  }
);

export default Inventory;
