# Roomly

เว็บจองห้องประชุมสำหรับทีม สร้างด้วย React และ Vite มีตารางดูห้องว่าง การจองซ้ำ ขั้นตอนอนุมัติ เช็กอิน และรายงานการใช้ห้อง

[เปิดเว็บ](https://yossaga.github.io/roomly/)

![Roomly](docs/overview.png)

โปรเจกต์นี้เป็น frontend ที่ใช้ข้อมูลตัวอย่าง ยังไม่มี backend ข้อมูลเก็บใน localStorage ส่วนการเชื่อม Google Calendar, Outlook และการสแกน QR ยังเป็นการจำลอง

ถ้าอยากลองฝั่งผู้ดูแลหรือเปลี่ยนเวลาสำหรับเช็กอิน เปิดเมนู **เกี่ยวกับและทดลองระบบ** ด้านล่างของเว็บได้

## รันในเครื่อง

ใช้ Node.js 22 ขึ้นไป

```sh
npm ci
npm run dev
```

- `npm test` ทดสอบกติกาการจอง
- `npm run build` สร้างไฟล์เว็บใน `dist`
- `npm run format` จัดรูปแบบโค้ด

โค้ดหน้าจออยู่ใน `src/advanced-pages.jsx` ฟอร์มอยู่ใน `src/advanced-ui.jsx` และกติกาการจองอยู่ใน `src/mock-model.js`

## เครดิต

ส่วนเลือกวันและเวลาอ้างอิง Calendar Scheduler ของ [Ruixen UI บน 21st.dev](https://21st.dev/@ruixen.ui/components/calendar-scheduler) และใช้ Daily Timeline Scheduler เป็นแนวทางในเวอร์ชันแรก รายละเอียดอยู่ใน [บันทึกที่มา](src/vendor/21st/README.md)

รูปห้องจาก Unsplash ฟอนต์จาก Google Fonts ไอคอนจาก Lucide
