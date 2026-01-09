import request from "supertest";
import app from "../app.js";

describe("Vehicle API", () => {

  test("Unauthorized add vehicle should be blocked", async () => {
    const response = await request(app)
      .post("/api/vehicles/")
      .send({
        vehicle_name: "Mahindra Thar"
      });

    expect(response.statusCode).toBe(401);
  });

});
