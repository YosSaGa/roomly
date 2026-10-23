export const minutes = time => {const [h,m]=time.split(':').map(Number);return h*60+m;};
export function validateBooking(form, bookings, room, now = new Date()) {
 if (!form.title.trim() || !form.name.trim()) return 'กรุณาระบุหัวข้อการประชุมและชื่อผู้จอง';
 if (!form.date || !form.start || !form.end) return 'กรุณาระบุวันและเวลาให้ครบ';
 if (minutes(form.end)<=minutes(form.start)) return 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น';
 if (minutes(form.start)<480 || minutes(form.end)>1080) return 'ห้องเปิดให้จองเวลา 08:00–18:00 น.';
 if (new Date(`${form.date}T${form.start}`) < now) return 'ไม่สามารถจองช่วงเวลาที่ผ่านมาแล้ว';
 if (!Number.isInteger(Number(form.people)) || Number(form.people)<1 || Number(form.people)>room.capacity) return `จำนวนผู้เข้าร่วมต้องอยู่ระหว่าง 1–${room.capacity} คน`;
 if (bookings.some(b=>b.room===room.id && b.date===form.date && minutes(form.start)<minutes(b.end) && minutes(form.end)>minutes(b.start))) return 'ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น';
 return '';
}
