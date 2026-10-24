import { minutes } from "./booking.js";

export const STORE_KEY = "roomly-advanced-demo-v1";
export const USERS = [
  { id: "u1", name: "คุณ · Product", role: "member", initials: "ME" },
  { id: "u2", name: "มิน · Office manager", role: "manager", initials: "MN" },
  { id: "u3", name: "แอดมิน · Workspace", role: "admin", initials: "AD" },
];
export const STATUS = {
  confirmed: "ยืนยันแล้ว",
  pending: "รออนุมัติ",
  checked_in: "เช็กอินแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  rejected: "ไม่อนุมัติ",
  no_show: "ไม่มาใช้งาน",
};
export const active = (b) =>
  ["confirmed", "pending", "checked_in"].includes(b.status);
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function addDate(key, n) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export const timeString = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const canManage = (user, b) =>
  user.role !== "member" || b.owner === user.id;
export function seedState(today = dateKey()) {
  const roomData = [
    ["The Botanical", 8, 2, "photo-1497366754035-f200968a6e72"],
    ["The Boardroom", 16, 3, "photo-1497366811353-6870744d04b2"],
    ["The Focus", 4, 2, "photo-1497366412874-3415097a27e7"],
    ["The Studio", 10, 4, "photo-1524758631624-e2822e304c36"],
    ["The Commons", 12, 3, "photo-1521737711867-e3b97375f902"],
    ["The Loft", 6, 4, "photo-1497366858526-0766cadbe8fa"],
  ];
  const rooms = roomData.map(([name, capacity, floor, img], i) => ({
    id: i + 1,
    name,
    capacity,
    floor,
    img,
    equipment: [
      "จอภาพ",
      "Wi-Fi",
      ...(i % 2 === 0 ? ["ไวท์บอร์ด"] : ["วิดีโอคอล"]),
    ],
    approval: i === 1,
    enabled: true,
    open: "08:00",
    close: "18:00",
    buffer: 0,
    maxDuration: 180,
    closedDates: i === 5 ? [addDate(today, 2)] : [],
  }));
  const entries = [
    ["Product standup", 1, "09:00", "09:30", "u1", "completed", 0],
    ["Quarterly planning", 2, "10:00", "11:30", "u2", "confirmed", 0],
    ["Design critique", 4, "13:00", "14:00", "u1", "confirmed", 0],
    ["Partner workshop", 2, "14:00", "16:00", "u1", "pending", 1],
    ["Sprint planning", 1, "10:00", "11:00", "u1", "confirmed", 1],
    ["User interviews", 3, "14:00", "15:00", "u2", "confirmed", 1],
    ["Team retrospective", 5, "15:00", "16:00", "u1", "confirmed", 2],
    ["Brand review", 4, "10:00", "11:00", "u2", "pending", 3],
    ["Operations sync", 6, "11:00", "12:00", "u2", "confirmed", 4],
    ["Research playback", 3, "09:00", "10:00", "u1", "no_show", -1],
    ["Roadmap review", 2, "10:00", "12:00", "u2", "completed", -1],
    ["Team catch-up", 1, "13:00", "14:00", "u1", "completed", -2],
    ["Client meeting", 2, "14:00", "15:30", "u2", "completed", -3],
  ];
  return {
    version: 1,
    rooms,
    bookings: entries.map(
      ([title, room, start, end, owner, status, offset], i) => ({
        id: "sample-" + i,
        title,
        room,
        start,
        end,
        owner,
        name: USERS.find((u) => u.id === owner).name,
        people: Math.min(rooms[room - 1].capacity, 6),
        status,
        date: addDate(today, offset),
        notes: "ข้อมูลตัวอย่างสำหรับทดลองระบบ",
        series: null,
        provider: "none",
      }),
    ),
    notifications: [
      {
        id: "welcome",
        title: "ยินดีต้อนรับสู่ Roomly",
        body: "เลือกห้องและเวลาที่ต้องการเพื่อเริ่มการจอง",
        read: false,
        time: new Date().toISOString(),
      },
    ],
    audit: [],
    connections: { google: false, outlook: false },
    lastSync: null,
    clock: { date: today, time: "10:00" },
  };
}
export function validate(form, state, user, { exclude = [], now } = {}) {
  const room = state.rooms.find((r) => r.id === Number(form.room));
  if (!room || !room.enabled) return "ห้องนี้ปิดให้บริการ";
  if (!form.title?.trim()) return "กรุณาระบุหัวข้อการประชุม";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
    !/^\d{2}:\d{2}$/.test(form.start) ||
    !/^\d{2}:\d{2}$/.test(form.end)
  )
    return "กรุณาเลือกวันและเวลา";
  const start = minutes(form.start),
    end = minutes(form.end);
  if (start >= end) return "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
  if (start < minutes(room.open) || end > minutes(room.close))
    return `ห้องเปิด ${room.open}–${room.close}`;
  if (end - start > room.maxDuration)
    return `ห้องนี้จองได้ครั้งละไม่เกิน ${room.maxDuration} นาที`;
  if (
    !Number.isInteger(Number(form.people)) ||
    Number(form.people) < 1 ||
    Number(form.people) > room.capacity
  )
    return `ห้องรองรับ 1–${room.capacity} คน`;
  if (room.closedDates.includes(form.date))
    return "ห้องปิดปรับปรุงในวันที่เลือก";
  const current = now || new Date(`${state.clock.date}T${state.clock.time}`);
  if (new Date(`${form.date}T${form.start}`) < current)
    return "เลือกเวลาหลังนาฬิกาจำลองของระบบ";
  if (
    state.bookings.some(
      (b) =>
        !exclude.includes(b.id) &&
        active(b) &&
        b.room === room.id &&
        b.date === form.date &&
        start < minutes(b.end) + room.buffer &&
        end + room.buffer > minutes(b.start),
    )
  )
    return `เวลาซ้ำกับการจองอื่น${room.buffer ? ` (รวมเวลาพัก ${room.buffer} นาที)` : ""}`;
  return "";
}
export function planBookings(form, state, user, editing = null) {
  if (
    editing &&
    (!canManage(user, editing) ||
      !["pending", "confirmed"].includes(editing.status))
  )
    return { error: "ไม่มีสิทธิ์แก้ไข หรือการจองเริ่มไปแล้ว" };
  const count = editing
    ? 1
    : form.repeat === "weekly"
      ? Number(form.count || 4)
      : 1;
  if (!Number.isInteger(count) || count < 1 || count > 12)
    return { error: "จองซ้ำได้ 1–12 สัปดาห์" };
  const rows = [];
  const series = count > 1 ? crypto.randomUUID() : editing?.series || null;
  for (let i = 0; i < count; i++) {
    const row = {
      ...form,
      room: Number(form.room),
      people: Number(form.people),
      date: addDate(form.date, i * 7),
    };
    const error = validate(
      row,
      { ...state, bookings: [...state.bookings, ...rows] },
      user,
      { exclude: editing ? [editing.id] : [] },
    );
    if (error) return { error: `${row.date}: ${error}` };
    rows.push({
      ...row,
      id: editing?.id || crypto.randomUUID(),
      owner: editing?.owner || user.id,
      name: editing?.name || user.name,
      series,
      status:
        state.rooms.find((r) => r.id === row.room).approval &&
        user.role === "member"
          ? "pending"
          : "confirmed",
    });
  }
  return { rows };
}
export function releaseNoShows(state) {
  const now = new Date(`${state.clock.date}T${state.clock.time}`);
  return state.bookings
    .filter(
      (b) =>
        b.status === "confirmed" &&
        now - new Date(`${b.date}T${b.start}`) >= 15 * 60000,
    )
    .map((b) => b.id);
}
export function summarize(state, start, end) {
  const rows = state.bookings.filter((b) => b.date >= start && b.date <= end);
  const valid = rows.filter(
    (b) => !["cancelled", "rejected", "no_show"].includes(b.status),
  );
  const days =
    Math.round(
      (new Date(end + "T12:00") - new Date(start + "T12:00")) / 86400000,
    ) + 1;
  const available = state.rooms
    .filter((r) => r.enabled)
    .reduce((n, r) => {
      let openDays = 0;
      for (let i = 0; i < days; i++)
        if (!r.closedDates.includes(addDate(start, i))) openDays++;
      return n + openDays * (minutes(r.close) - minutes(r.open));
    }, 0);
  const booked = valid.reduce(
    (n, b) => n + minutes(b.end) - minutes(b.start),
    0,
  );
  return {
    rows,
    valid,
    hours: booked / 60,
    utilization: available ? Math.round((booked / available) * 100) : 0,
    noShows: rows.filter((b) => b.status === "no_show").length,
  };
}
