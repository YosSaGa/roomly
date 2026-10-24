import React, { useEffect, useRef, useState } from "react";
import { X, Check, CalendarDays, Users, Repeat, Video } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { th } from "date-fns/locale";
import {
  dateKey,
  STATUS,
  planBookings,
  validate,
  timeString,
  active,
} from "./mock-model";
import { minutes } from "./booking";
import "react-day-picker/style.css";

export function Badge({ status }) {
  return (
    <span className={"status-badge " + status}>
      <i />
      {STATUS[status] || status}
    </span>
  );
}
export function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector("button,input,select")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handle(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea,a[href]",
          ),
        ].filter((n) => n.getClientRects().length);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="overlay adv-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className={"adv-dialog " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="dialog-top">
          <div>
            <small>ROOMLY</small>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="ปิด" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function BookingEditor({ state, user, initial, onClose, onSave }) {
  const edit = initial?.id ? initial : null;
  const [form, setForm] = useState({
    title: "",
    room: state.rooms.find((r) => r.enabled)?.id || 1,
    date: state.clock.date,
    start: "",
    end: "",
    people: 2,
    repeat: "none",
    count: 4,
    provider: "none",
    notes: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const room = state.rooms.find((r) => r.id === Number(form.room));
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const conflictState = {
    ...state,
    bookings: state.bookings.filter((b) => b.id !== edit?.id),
  };
  const slots = Array.from({ length: 20 }, (_, i) => timeString(480 + i * 30));
  return (
    <Dialog
      wide
      title={edit ? "แก้ไขการจอง" : "จองห้องประชุม"}
      onClose={onClose}
    >
      <form
        className="booking-editor"
        onSubmit={(e) => {
          e.preventDefault();
          const result = planBookings(form, state, user, edit);
          if (result.error) {
            setError(result.error);
            return;
          }
          onSave(result.rows, edit);
        }}
      >
        <div className="editor-main">
          <div className="form-grid">
            <label>
              หัวข้อการประชุม
              <input
                required
                name="title"
                maxLength={80}
                value={form.title}
                placeholder="เช่น Sprint planning"
                onChange={change}
              />
            </label>
            <label>
              ห้องประชุม
              <select
                name="room"
                value={form.room}
                onChange={(e) =>
                  setForm({
                    ...form,
                    room: Number(e.target.value),
                    start: "",
                    end: "",
                  })
                }
              >
                {state.rooms.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.enabled}>
                    {r.name} · {r.capacity} คน
                    {r.approval ? " · ต้องอนุมัติ" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="room-rule">
            <Users size={14} />
            {room.capacity} คน{" "}
            <span>
              เปิด {room.open}–{room.close}
            </span>
            <span>สูงสุด {room.maxDuration} นาที</span>
            {room.buffer > 0 && <span>พัก {room.buffer} นาที</span>}
          </div>
          <section className="ruixen-scheduler">
            <div className="scheduler-heading">
              <CalendarDays size={16} />
              <h3>เลือกวันและเวลา</h3>
              <span>ขั้นละ 30 นาที</span>
            </div>
            <div className="scheduler-content">
              <div className="scheduler-calendar">
                <DayPicker
                  mode="single"
                  required
                  locale={th}
                  weekStartsOn={1}
                  defaultMonth={new Date(form.date + "T12:00")}
                  selected={new Date(form.date + "T12:00")}
                  disabled={[
                    { before: new Date(state.clock.date + "T00:00") },
                    ...room.closedDates.map((d) => new Date(d + "T12:00")),
                  ]}
                  onSelect={(d) =>
                    d &&
                    setForm({ ...form, date: dateKey(d), start: "", end: "" })
                  }
                />
              </div>
              <div className="scheduler-times">
                <p>เวลาเริ่มต้น · 1 ชั่วโมง</p>
                <div className="scheduler-slots">
                  {slots.map((start) => {
                    const end = timeString(minutes(start) + 60);
                    const blocked = validate(
                      { ...form, title: form.title || "เลือกเวลา", start, end },
                      conflictState,
                      user,
                    );
                    return (
                      <button
                        type="button"
                        key={start}
                        disabled={!!blocked}
                        title={blocked || `${start}–${end}`}
                        aria-pressed={form.start === start}
                        onClick={() => setForm({ ...form, start, end })}
                      >
                        {start}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="scheduler-credit">
              Adapted from{" "}
              <a
                href="https://21st.dev/@ruixen.ui/components/calendar-scheduler"
                target="_blank"
                rel="noreferrer"
              >
                Calendar Scheduler · Ruixen UI ↗
              </a>
            </p>
          </section>
          <div className="form-grid three">
            <label>
              เริ่มต้น
              <input
                required
                type="time"
                name="start"
                value={form.start}
                onChange={change}
              />
            </label>
            <label>
              สิ้นสุด
              <input
                required
                type="time"
                name="end"
                value={form.end}
                onChange={change}
              />
            </label>
            <label>
              ผู้เข้าร่วม
              <input
                required
                type="number"
                name="people"
                min="1"
                max={room.capacity}
                value={form.people}
                onChange={change}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              <span>
                <Repeat size={13} />
                การจองซ้ำ
              </span>
              <select
                name="repeat"
                value={form.repeat}
                disabled={!!edit}
                onChange={change}
              >
                <option value="none">ครั้งเดียว</option>
                <option value="weekly">ทุกสัปดาห์</option>
              </select>
            </label>
            <label>
              จำนวนสัปดาห์
              <input
                type="number"
                name="count"
                min="1"
                max="12"
                disabled={!!edit || form.repeat !== "weekly"}
                value={form.count}
                onChange={change}
              />
            </label>
          </div>
          <label>
            <span>
              <Video size={13} />
              การประชุมออนไลน์ (จำลอง)
            </span>
            <select name="provider" value={form.provider} onChange={change}>
              <option value="none">ประชุมที่ห้องเท่านั้น</option>
              <option value="google" disabled={!state.connections.google}>
                Google Meet{" "}
                {state.connections.google ? "" : "· ยังไม่เชื่อมต่อ"}
              </option>
              <option value="outlook" disabled={!state.connections.outlook}>
                Microsoft Teams{" "}
                {state.connections.outlook ? "" : "· ยังไม่เชื่อมต่อ"}
              </option>
            </select>
          </label>
          <label>
            บันทึกเพิ่มเติม
            <textarea
              name="notes"
              rows="2"
              maxLength={500}
              value={form.notes}
              onChange={change}
            />
          </label>
        </div>
        <aside className="editor-summary">
          <span className="summary-step">RESERVATION SUMMARY</span>
          <h3>{room.name}</h3>
          <p>อาคาร A · ชั้น {room.floor}</p>
          <dl>
            <dt>ผู้จอง</dt>
            <dd>{edit?.name || user.name}</dd>
            <dt>วันที่</dt>
            <dd>{form.date}</dd>
            <dt>เวลา</dt>
            <dd>
              {form.start || "—"} – {form.end || "—"}
            </dd>
            <dt>ระยะเวลา</dt>
            <dd>
              {form.start && form.end
                ? Math.max(0, minutes(form.end) - minutes(form.start))
                : 0}{" "}
              นาที
            </dd>
            <dt>จำนวนครั้ง</dt>
            <dd>{form.repeat === "weekly" && !edit ? form.count : 1} ครั้ง</dd>
          </dl>
          <Badge
            status={
              room.approval && user.role === "member" ? "pending" : "confirmed"
            }
          />
          <p className="summary-note">
            {room.approval && user.role === "member"
              ? "ห้องนี้ต้องได้รับอนุมัติจากผู้ดูแลก่อนเช็กอิน"
              : "เช็กอินได้ก่อนเริ่มประชุม 15 นาที"}
          </p>
          {edit?.series && (
            <p className="summary-note">แก้ไขเฉพาะครั้งนี้ในชุดการจอง</p>
          )}
          <p className="summary-note">
            เวลาอ้างอิง {state.clock.date} {state.clock.time}
          </p>
        </aside>
        {error && (
          <p role="alert" className="error editor-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>
            กลับ
          </button>
          <button className="primary" type="submit">
            <Check size={15} />
            {edit ? "บันทึกการแก้ไข" : "ยืนยันการจอง"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function RoomEditor({ room, onClose, onSave }) {
  const [form, setForm] = useState(room);
  const [error, setError] = useState("");
  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  return (
    <Dialog title="จัดการห้องประชุม" onClose={onClose}>
      <form
        className="room-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (minutes(form.open) >= minutes(form.close)) {
            setError("เวลาปิดต้องอยู่หลังเวลาเปิด");
            return;
          }
          onSave({
            ...form,
            capacity: Number(form.capacity),
            floor: Number(form.floor),
            buffer: Number(form.buffer),
            maxDuration: Number(form.maxDuration),
            closedDates: [...new Set(form.closedDates)],
          });
        }}
      >
        <label>
          ชื่อห้อง
          <input required name="name" value={form.name} onChange={change} />
        </label>
        <div className="form-grid">
          <label>
            ความจุ
            <input
              required
              type="number"
              name="capacity"
              min="1"
              max="100"
              value={form.capacity}
              onChange={change}
            />
          </label>
          <label>
            ชั้น
            <input
              required
              type="number"
              name="floor"
              min="1"
              max="99"
              value={form.floor}
              onChange={change}
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            เวลาเปิด
            <input
              required
              type="time"
              name="open"
              value={form.open}
              onChange={change}
            />
          </label>
          <label>
            เวลาปิด
            <input
              required
              type="time"
              name="close"
              value={form.close}
              onChange={change}
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            เวลาพักระหว่างจอง (นาที)
            <input
              required
              type="number"
              name="buffer"
              min="0"
              max="60"
              step="5"
              value={form.buffer}
              onChange={change}
            />
          </label>
          <label>
            จองสูงสุด (นาที)
            <input
              required
              type="number"
              name="maxDuration"
              min="30"
              max="600"
              step="30"
              value={form.maxDuration}
              onChange={change}
            />
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            name="enabled"
            checked={form.enabled}
            onChange={change}
          />
          เปิดให้จอง
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            name="approval"
            checked={form.approval}
            onChange={change}
          />
          ต้องได้รับอนุมัติ
        </label>
        <fieldset>
          <legend>อุปกรณ์</legend>
          {["จอภาพ", "Wi-Fi", "ไวท์บอร์ด", "วิดีโอคอล", "โปรเจกเตอร์"].map(
            (x) => (
              <label className="check-label" key={x}>
                <input
                  type="checkbox"
                  checked={form.equipment.includes(x)}
                  onChange={() =>
                    setForm({
                      ...form,
                      equipment: form.equipment.includes(x)
                        ? form.equipment.filter((v) => v !== x)
                        : [...form.equipment, x],
                    })
                  }
                />
                {x}
              </label>
            ),
          )}
        </fieldset>
        <label>
          เพิ่มวันปิดปรับปรุง
          <input
            type="date"
            value=""
            onChange={(e) =>
              e.target.value &&
              setForm({
                ...form,
                closedDates: [
                  ...new Set([...form.closedDates, e.target.value]),
                ],
              })
            }
          />
        </label>
        <div className="closure-tags">
          {form.closedDates.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() =>
                setForm({
                  ...form,
                  closedDates: form.closedDates.filter((x) => x !== d),
                })
              }
            >
              {d}
              <X size={12} />
            </button>
          ))}
        </div>
        <p className="muted">
          กติกาใหม่ใช้กับการสร้าง/แก้ไขครั้งถัดไป การจองเดิมยังคงอยู่
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>
            กลับ
          </button>
          <button className="primary" type="submit">
            บันทึกห้อง
          </button>
        </div>
      </form>
    </Dialog>
  );
}
