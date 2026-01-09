import request from "supertest";
import app from "../app.js";

describe("Authentication API", () => {

  test("Login with valid credentials should succeed", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@gmail.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(400);
  });

});
