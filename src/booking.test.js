import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBooking } from "./booking.js";
const room = { id: 1, capacity: 8 },
  now = new Date("2026-10-23T08:00");
const valid = {
  title: "Planning",
  name: "Tester",
  date: "2026-10-24",
  start: "09:00",
  end: "10:00",
  people: 4,
};
const existing = [{ room: 1, date: valid.date, start: "10:00", end: "11:00" }];
test("accepts adjacent reservations", () =>
  assert.equal(validateBooking(valid, existing, room, now), ""));
test("rejects partial overlap and enclosing bookings", () => {
  for (const [start, end] of [
    ["09:30", "10:30"],
    ["09:00", "12:00"],
    ["10:15", "10:45"],
  ])
    assert.ok(validateBooking({ ...valid, start, end }, existing, room, now));
});
test("allows different room and date", () => {
  assert.equal(
    validateBooking(
      { ...valid, start: "10:00", end: "11:00" },
      existing,
      { ...room, id: 2 },
      now,
    ),
    "",
  );
  assert.equal(
    validateBooking({ ...valid, date: "2026-10-25" }, existing, room, now),
    "",
  );
});
test("rejects invalid duration, capacity, past and hours", () => {
  for (const patch of [
    { end: "08:00" },
    { people: 9 },
    { people: 0 },
    { people: 1.5 },
    { date: "2026-10-22" },
    { start: "07:00" },
    { end: "19:00" },
  ])
    assert.ok(validateBooking({ ...valid, ...patch }, [], room, now));
});
