import request from "supertest";
import app from "../app.js";   // IMPORTANT: .js extension required

describe("Booking API", () => {

  test("Create booking should succeed", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        vehicle_id: 1,
        service_id: 1,
        date: "2026-01-10"
      });

    expect(response.statusCode).toBe(400);
  });

});
