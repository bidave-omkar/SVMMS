import request from "supertest";
import app from "../app.js";

describe("Job Card API", () => {

  test("Unauthorized job card creation should be blocked", async () => {
    const response = await request(app)
      .post("/api/service-center/job-cards/")
      .send({
        booking_id: 1,
        description: "Oil change and inspection"
      });

    expect(response.statusCode).toBe(403);
  });

});
