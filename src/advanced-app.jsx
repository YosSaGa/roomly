import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  CheckCheck,
  Bell,
  ScanLine,
  Plug,
  ChartNoAxesCombined,
  History,
  Plus,
  Menu,
  X,
  Check,
  Download,
} from "lucide-react";
import {
  STORE_KEY,
  USERS,
  seedState,
  addDate,
  timeString,
  planBookings,
  validate,
  active,
  canManage,
  releaseNoShows,
} from "./mock-model";
import { minutes } from "./booking";
import { Dialog, BookingEditor, RoomEditor } from "./advanced-ui";
import {
  Overview,
  Schedule,
  Bookings,
  ApprovalQueue,
  RoomCatalog,
  Checkin,
  Connections,
  Reports,
  Audit,
  Notifications,
  downloadFile,
} from "./advanced-pages";
import "./workspace.css";
import "./components/scheduler.css";
import "./advanced.css";
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (
      s?.version === 1 &&
      s.rooms?.length &&
      Array.isArray(s.bookings) &&
      s.notifications &&
      s.audit &&
      s.clock
    )
      return s;
  } catch {}
  return seedState();
}
const NAV = [
  ["overview", LayoutDashboard, "ภาพรวม"],
  ["calendar", CalendarDays, "ตารางห้องประชุม"],
  ["bookings", ClipboardList, "การจองของฉัน"],
  ["rooms", DoorOpen, "ห้องประชุม"],
  ["approvals", CheckCheck, "คำขออนุมัติ", "manager"],
  ["checkin", ScanLine, "เช็กอิน / จอหน้าห้อง"],
  ["notifications", Bell, "การแจ้งเตือน"],
  ["connections", Plug, "เชื่อมต่อปฏิทิน"],
  ["reports", ChartNoAxesCombined, "รายงาน", "manager"],
  ["audit", History, "ประวัติการทำงาน", "manager"],
];
function App() {
  const [state, setState] = useState(load),
    [userId, setUserId] = useState("u1"),
    [page, setPage] = useState("overview"),
    [editor, setEditor] = useState(null),
    [roomEditor, setRoomEditor] = useState(null),
    [confirm, setConfirm] = useState(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [storageError, setStorageError] = useState(false),
    [toolsOpen, setToolsOpen] = useState(false);
  const user = USERS.find((u) => u.id === userId),
    unread = state.notifications.filter((n) => !n.read).length;
  const nav = NAV.filter(
    (n) =>
      !n[3] ||
      (n[3] === "manager" && user.role !== "member") ||
      (n[3] === "admin" && user.role === "admin"),
  );
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    function sync(e) {
      if (e.key === STORE_KEY && e.newValue) {
        try {
          const s = JSON.parse(e.newValue);
          if (s.version === 1) {
            setState(s);
            setToast("รับการเปลี่ยนแปลงจากอีกแท็บแล้ว");
          }
        } catch {}
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMobile(false);
  }, [page]);
  useEffect(() => {
    if (!mobile) return;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMobile(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobile]);
  function commit(action, detail, update) {
    setState((prev) => {
      const next = update(prev),
        time = new Date().toISOString();
      return {
        ...next,
        audit: [
          { id: crypto.randomUUID(), action, detail, actor: user.name, time },
          ...next.audit,
        ].slice(0, 200),
        notifications: [
          {
            id: crypto.randomUUID(),
            title: action,
            body: detail,
            read: false,
            time,
          },
          ...next.notifications,
        ].slice(0, 100),
      };
    });
    setToast(action);
  }
  function switchUser(id) {
    setUserId(id);
    setToolsOpen(false);
    setPage("overview");
    setMobile(false);
    setEditor(null);
    setRoomEditor(null);
    setConfirm(null);
  }
  function openBook(initial = {}) {
    setEditor({
      date: state.clock.date,
      room: state.rooms.find((r) => r.enabled)?.id || 1,
      ...initial,
    });
  }
  function edit(b) {
    if (!canManage(user, b)) {
      setToast("สมาชิกแก้ไขได้เฉพาะการจองของตัวเอง");
      return;
    }
    if (!["confirmed", "pending"].includes(b.status)) {
      setToast("รายการนี้เริ่มไปแล้วหรือปิดแล้ว");
      return;
    }
    setEditor(b);
  }
  function save(rows, editing) {
    commit(
      editing ? "แก้ไขการจองแล้ว" : "สร้างการจองแล้ว",
      `${rows[0].title} · ${rows.length} ครั้ง`,
      (prev) => ({
        ...prev,
        bookings: [
          ...prev.bookings.filter((b) => b.id !== editing?.id),
          ...rows,
        ],
      }),
    );
    setEditor(null);
  }
  function move(b, patch) {
    const result = planBookings({ ...b, ...patch }, state, user, b);
    if (result.error) {
      setToast(result.error);
      return;
    }
    save(result.rows, b);
  }
  function cancel(b) {
    if (!canManage(user, b)) return;
    setConfirm({
      title: "ยกเลิกการจอง",
      body: `${b.title} · ${b.date} ${b.start}–${b.end}`,
      series: !!b.series,
      action: (scope) =>
        commit("ยกเลิกการจองแล้ว", b.title, (prev) => ({
          ...prev,
          bookings: prev.bookings.map((x) =>
            (x.id === b.id ||
              (scope &&
                x.series === b.series &&
                canManage(user, x) &&
                new Date(x.date + "T" + x.start) >=
                  new Date(prev.clock.date + "T" + prev.clock.time))) &&
            active(x)
              ? { ...x, status: "cancelled" }
              : x,
          ),
        })),
    });
  }
  function decision(b, status, note) {
    if (user.role === "member") return;
    if (status === "rejected" && !note?.trim()) {
      setToast("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }
    if (status === "confirmed") {
      const error = validate(b, state, user, { exclude: [b.id] });
      if (error) {
        setToast(error);
        return;
      }
    }
    commit(
      status === "confirmed" ? "อนุมัติแล้ว" : "ไม่อนุมัติ",
      `${b.title} · ${note || "ผ่านการตรวจสอบ"}`,
      (prev) => ({
        ...prev,
        bookings: prev.bookings.map((x) =>
          x.id === b.id
            ? { ...x, status, decisionNote: note || "", decidedBy: user.id }
            : x,
        ),
      }),
    );
  }
  function checkin(b) {
    if (!canManage(user, b) || b.status !== "confirmed") {
      setToast("ไม่มีสิทธิ์เช็กอินรายการนี้");
      return false;
    }
    const now = new Date(state.clock.date + "T" + state.clock.time),
      start = new Date(b.date + "T" + b.start),
      end = new Date(b.date + "T" + b.end);
    if (now.getTime() < start.getTime() - 15 * 60000 || now >= end) {
      setToast(
        `ตั้งนาฬิกาจำลองเป็น ${b.date} ช่วง ${b.start}–${b.end} เพื่อทดลองเช็กอิน`,
      );
      return false;
    }
    const r = state.rooms.find((r) => r.id === b.room);
    if (!r.enabled || r.closedDates.includes(b.date)) {
      setToast("ห้องปิดให้บริการ");
      return false;
    }
    commit("เช็กอินเรียบร้อย", b.title, (prev) => ({
      ...prev,
      bookings: prev.bookings.map((x) =>
        x.id === b.id ? { ...x, status: "checked_in" } : x,
      ),
    }));
    return true;
  }
  function checkout(b) {
    if (canManage(user, b))
      commit("เช็กเอาต์เรียบร้อย", b.title, (prev) => ({
        ...prev,
        bookings: prev.bookings.map((x) =>
          x.id === b.id ? { ...x, status: "completed" } : x,
        ),
      }));
  }
  function release() {
    if (user.role === "member") return;
    const ids = releaseNoShows(state);
    if (!ids.length) {
      setToast("ไม่มีรายการที่เลยเวลาเช็กอิน 15 นาที");
      return;
    }
    setConfirm({
      title: "ปล่อยห้องที่ไม่มาใช้งาน",
      body: `พบ ${ids.length} รายการที่ยังไม่เช็กอินและเลยเวลาเริ่ม 15 นาที`,
      action: () =>
        commit("ปล่อยห้องจำลองแล้ว", `${ids.length} รายการ`, (prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) =>
            ids.includes(b.id) ? { ...b, status: "no_show" } : b,
          ),
        })),
    });
  }
  function remind() {
    const now = new Date(state.clock.date + "T" + state.clock.time);
    const rows = state.bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        new Date(b.date + "T" + b.start) - now >= 0 &&
        new Date(b.date + "T" + b.start) - now <= 15 * 60000,
    );
    commit(
      "แจ้งเตือนก่อนประชุมจำลอง",
      rows.length
        ? rows.map((b) => `${b.title} เริ่ม ${b.start}`).join(" · ")
        : "ไม่มีการประชุมที่เริ่มภายใน 15 นาที",
      (prev) => prev,
    );
  }
  function teammate() {
    const other = USERS.find((u) => u.id !== user.id);
    for (let i = 0; i < 10; i++) {
      const form = {
        title: "นัดหมายจากเพื่อนร่วมทีม (จำลอง)",
        room: 3,
        date: addDate(state.clock.date, 1),
        start: timeString(480 + i * 60),
        end: timeString(540 + i * 60),
        people: 2,
        provider: "none",
      };
      const result = planBookings(form, state, other);
      if (result.rows) {
        commit(
          "ได้รับการจองใหม่จำลอง",
          `${other.name} · ${form.start}`,
          (prev) => ({ ...prev, bookings: [...prev.bookings, ...result.rows] }),
        );
        return;
      }
    }
    setToast("ไม่มีเวลาว่างสำหรับสถานการณ์จำลอง");
  }
  function exportICS() {
    const clean = (s) =>
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    const stamp = (date, time) =>
      date.replaceAll("-", "") + "T" + time.replace(":", "") + "00";
    downloadFile(
      "roomly-demo.ics",
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Roomly//Demo//TH",
        ...state.bookings
          .filter((b) => active(b) && b.owner === user.id)
          .flatMap((b) => [
            "BEGIN:VEVENT",
            `UID:${b.id}@roomly.demo`,
            `DTSTAMP:${new Date()
              .toISOString()
              .replace(/[-:]/g, "")
              .replace(/\.\d{3}/, "")}`,
            `DTSTART;TZID=Asia/Bangkok:${stamp(b.date, b.start)}`,
            `DTEND;TZID=Asia/Bangkok:${stamp(b.date, b.end)}`,
            `SUMMARY:${clean(b.title)}`,
            `LOCATION:${clean(state.rooms.find((r) => r.id === b.room)?.name)}`,
            "DESCRIPTION:Roomly demo booking",
            "END:VEVENT",
          ]),
        "END:VCALENDAR",
      ].join("\r\n"),
      "text/calendar",
    );
  }
  let content;
  if (page === "overview")
    content = <Overview state={state} onBook={openBook} onPage={setPage} />;
  if (page === "calendar")
    content = (
      <Schedule
        state={state}
        user={user}
        onBook={openBook}
        onEdit={edit}
        onMove={move}
        onExtend={(b) => move(b, { end: timeString(minutes(b.end) + 30) })}
      />
    );
  if (page === "bookings")
    content = (
      <Bookings
        state={state}
        user={user}
        onEdit={edit}
        onCancel={cancel}
        onCheckin={checkin}
      />
    );
  if (page === "rooms")
    content = (
      <RoomCatalog
        state={state}
        user={user}
        onBook={openBook}
        onEditRoom={setRoomEditor}
      />
    );
  if (page === "approvals" && user.role !== "member")
    content = <ApprovalQueue state={state} onDecision={decision} />;
  if (page === "checkin")
    content = (
      <Checkin
        state={state}
        user={user}
        onCheckin={checkin}
        onCheckout={checkout}
        onRelease={release}
      />
    );
  if (page === "connections")
    content = (
      <>
        <Connections
          state={state}
          onConnect={(id, value) =>
            commit(
              value ? "เชื่อมต่อจำลองแล้ว" : "ตัดการเชื่อมต่อจำลองแล้ว",
              id,
              (p) => ({ ...p, connections: { ...p.connections, [id]: value } }),
            )
          }
          onSync={() =>
            commit(
              "ซิงก์ปฏิทินจำลองสำเร็จ",
              `${state.bookings.filter(active).length} รายการ · ไม่ส่งข้อมูลออก`,
              (p) => ({ ...p, lastSync: new Date().toISOString() }),
            )
          }
        />
        <div className="ics-export">
          <span>นำรายการจองของฉันไปเปิดในแอปปฏิทิน</span>
          <button className="secondary" onClick={exportICS}>
            <Download size={14} />
            ดาวน์โหลด .ics
          </button>
        </div>
      </>
    );
  if (page === "reports" && user.role !== "member")
    content = <Reports state={state} />;
  if (page === "audit" && user.role !== "member")
    content = <Audit state={state} />;
  if (page === "notifications")
    content = (
      <Notifications
        state={state}
        onRead={(id) =>
          setState((p) => ({
            ...p,
            notifications: p.notifications.map((n) =>
              id === "all" || n.id === id ? { ...n, read: true } : n,
            ),
          }))
        }
        onRemind={remind}
      />
    );
  return (
    <div className="advanced-app">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="logo"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("overview");
          }}
        >
          <span className="logo-mark">
            <i />
            <i />
            <i />
          </span>
          roomly
        </a>
        <div className="demo-workspace">
          <span className="workspace-square">B</span>
          <div>
            <b>Bangkok Office</b>
            <small>อาคาร A · กรุงเทพฯ</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([id, Icon, label]) => (
            <button
              className={page === id ? "active" : ""}
              key={id}
              onClick={() => {
                setPage(id);
                setMobile(false);
              }}
            >
              <Icon size={16} />
              {label}
              {id === "approvals" && (
                <span className="nav-count">
                  {state.bookings.filter((b) => b.status === "pending").length}
                </span>
              )}
              {id === "notifications" && unread > 0 && (
                <span className="nav-count">{unread}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user.initials}</span>
          <div>
            <b>{user.name}</b>
            <small>
              {user.role === "member"
                ? "สมาชิก"
                : user.role === "manager"
                  ? "ผู้ดูแลห้อง"
                  : "ผู้ดูแลระบบ"}
            </small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div>
            <button
              className="icon-button mobile-toggle"
              aria-label="เปิดเมนู"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={19} />
            </button>
            <span>Bangkok Office /</span>
            <b>{NAV.find((n) => n[0] === page)?.[2]}</b>
          </div>
          <div className="header-tools">
            <button
              className="icon-button"
              aria-label="การแจ้งเตือน"
              onClick={() => setPage("notifications")}
            >
              <Bell size={17} />
              {unread > 0 && <span className="bell-dot" />}
            </button>
            <span className="avatar" title={user.name}>
              {user.initials}
            </span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="heading-meta">
                WORKSPACE / {page.toUpperCase()}
              </div>
              <h1>
                {NAV.find((n) => n[0] === page)?.[2]}
                <span className="heading-period">.</span>
              </h1>
              <p>
                {
                  {
                    overview: "ดูนัดหมายและห้องว่างของทีม",
                    calendar: "เลือกช่วงเวลาและห้องที่เหมาะกับการประชุม",
                    bookings: "ติดตามและจัดการนัดหมายของคุณ",
                    rooms: "พื้นที่สำหรับทุกขนาดทีม",
                    approvals: "ตรวจสอบรายการที่รอการอนุมัติ",
                    checkin: "ดูสถานะห้องและยืนยันการเข้าใช้งาน",
                    notifications: "ความเคลื่อนไหวเกี่ยวกับการจองของคุณ",
                    connections: "จัดการปฏิทินและการประชุมออนไลน์",
                    reports: "ภาพรวมการใช้พื้นที่ประชุม",
                    audit: "รายการเปลี่ยนแปลงและผู้ดำเนินการ",
                  }[page]
                }
              </p>
            </div>
            <button className="primary" onClick={() => openBook()}>
              <Plus size={16} />
              จองห้องประชุม
            </button>
          </div>
          {storageError && (
            <p className="error" role="alert">
              บันทึกข้อมูลไม่สำเร็จ การเปลี่ยนแปลงอาจหายเมื่อปิดหน้าเว็บ
            </p>
          )}
          {content}
          <footer>
            <span>Roomly · ตัวอย่างระบบจองห้องประชุม</span>
            <div className="footer-links">
              <button onClick={() => setToolsOpen(true)}>
                เกี่ยวกับและทดลองระบบ
              </button>
              <a href="https://github.com/YosSaGa/roomly">GitHub ↗</a>
            </div>
          </footer>
        </main>
      </div>
      {toolsOpen && (
        <Dialog title="เกี่ยวกับ Roomly" onClose={() => setToolsOpen(false)}>
          <div className="demo-tools">
            <p>
              ตัวอย่างระบบจองห้องประชุมที่ใช้ข้อมูลสมมติ
              การเปลี่ยนแปลงเก็บเฉพาะในเบราว์เซอร์นี้
              ไม่มีบัญชีผู้ใช้หรือการเชื่อมปฏิทินจริง
            </p>
            <section>
              <h3>ทดลองมุมมองอื่น</h3>
              <div className="role-options">
                {USERS.map((u) => (
                  <button
                    key={u.id}
                    className={u.id === userId ? "primary" : "secondary"}
                    onClick={() => switchUser(u.id)}
                  >
                    {u.role === "member"
                      ? "สมาชิก"
                      : u.role === "manager"
                        ? "ผู้ดูแลห้อง"
                        : "ผู้ดูแลระบบ"}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>วันและเวลาสำหรับทดลอง</h3>
              <p>ใช้ลองเช็กอินหรือปล่อยห้องที่เลยเวลานัดหมาย</p>
              <div className="form-grid">
                <label>
                  วันที่
                  <input
                    aria-label="วันที่จำลอง"
                    type="date"
                    value={state.clock.date}
                    onChange={(e) =>
                      e.target.value &&
                      setState((p) => ({
                        ...p,
                        clock: { ...p.clock, date: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  เวลา
                  <input
                    aria-label="เวลาจำลอง"
                    type="time"
                    value={state.clock.time}
                    onChange={(e) =>
                      e.target.value &&
                      setState((p) => ({
                        ...p,
                        clock: { ...p.clock, time: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </section>
            <section>
              <h3>ข้อมูลตัวอย่าง</h3>
              <div className="scenario-actions">
                <button className="secondary" onClick={teammate}>
                  เพิ่มนัดหมายของเพื่อนร่วมทีม
                </button>
                <button className="secondary" onClick={remind}>
                  สร้างแจ้งเตือนก่อนประชุม
                </button>
                {user.role !== "member" && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setToolsOpen(false);
                      release();
                    }}
                  >
                    ตรวจรายการไม่มาใช้งาน
                  </button>
                )}
                <button
                  className="secondary"
                  onClick={() =>
                    downloadFile(
                      "roomly-backup.json",
                      JSON.stringify(state, null, 2),
                      "application/json",
                    )
                  }
                >
                  ส่งออกข้อมูล
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setToolsOpen(false);
                    setConfirm({
                      title: "เริ่มข้อมูลตัวอย่างใหม่",
                      body: "รายการที่คุณเพิ่มในเบราว์เซอร์นี้จะถูกแทนที่ด้วยข้อมูลเริ่มต้น",
                      action: () => {
                        setState(seedState());
                        setPage("overview");
                        setToast("เริ่มข้อมูลตัวอย่างใหม่แล้ว");
                      },
                    });
                  }}
                >
                  เริ่มใหม่
                </button>
              </div>
            </section>
            <p className="muted">
              ปฏิทินอ้างอิงเวลาเครื่องของคุณ · รูปห้องจาก Unsplash ·
              คอมโพเนนต์ปฏิทินปรับจาก Ruixen UI บน 21st.dev
            </p>
          </div>
        </Dialog>
      )}
      {editor && (
        <BookingEditor
          state={state}
          user={user}
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}{" "}
      {roomEditor && user.role !== "member" && (
        <RoomEditor
          room={roomEditor}
          onClose={() => setRoomEditor(null)}
          onSave={(room) => {
            commit("อัปเดตห้องประชุมแล้ว", room.name, (p) => ({
              ...p,
              rooms: p.rooms.map((r) => (r.id === room.id ? room : r)),
            }));
            setRoomEditor(null);
          }}
        />
      )}
      {confirm && <Confirm data={confirm} onClose={() => setConfirm(null)} />}{" "}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button aria-label="ปิดข้อความ" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function Confirm({ data, onClose }) {
  const [series, setSeries] = useState(false);
  return (
    <Dialog title={data.title} onClose={onClose}>
      <div className="confirm-body">
        <p>{data.body}</p>
        {data.series && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={series}
              onChange={(e) => setSeries(e.target.checked)}
            />
            ยกเลิกทั้งชุดที่ยังไม่เริ่ม
          </label>
        )}
        <div className="dialog-actions">
          <button className="secondary" onClick={onClose}>
            กลับ
          </button>
          <button
            className="primary"
            onClick={() => {
              data.action(series);
              onClose();
            }}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </Dialog>
  );
}
createRoot(document.getElementById("root")).render(<App />);
