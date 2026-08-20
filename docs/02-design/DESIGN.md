# Design System

เอกสารนี้คือแหล่งอ้างอิงหลัก (single source of truth) ของ Design System เชิงภาพสำหรับโปรเจกต์นี้
ที่มา: **ดึงมาจาก token จริงใน `react-template-main`** (Tailwind config + index.css) ตามที่ผู้ใช้
ขอให้ใช้เป็นจุดเริ่มต้นก่อน เนื่องจาก template นี้เป็นมาตรฐานบังคับจาก CIO ตาม
[[technology-stack]] อยู่แล้ว การใช้สี/font เดียวกันจึงทำให้ Prototype ตรงกับสิ่งที่ระบบจริงจะ
หน้าตาเป็นตั้งแต่ต้น

**หมายเหตุสถานะ:** เอกสารนี้เป็นจุดเริ่มต้น (v1) จาก token ที่ template มีอยู่แล้วเท่านั้น
ส่วนที่ template ไม่ได้กำหนดไว้ (เช่น สีสถานะเชิงความหมาย, สถานะงานเฉพาะของระบบนี้) ถูกเพิ่มเข้ามา
โดยยึดหลัก "ใกล้เคียง Tailwind default ที่สุด" เพื่อให้ปรับภายหลังได้ง่าย หากทีมออกแบบต้องการ
เปลี่ยนแปลง ให้แก้ที่เอกสารนี้ก่อนเสมอ แล้วค่อยสะท้อนไปยัง Prototype ใน `01-prototypes/`

## สี (Color Palette)

### Primary — จาก `react-template-main/tailwind.config.js`

| Token | Hex | การใช้งาน |
|-------|-----|-----------|
| primary-50 | `#fef1f4` | พื้นหลังอ่อนมาก (hover state บนพื้นขาว) |
| primary-100 | `#fde2e8` | พื้นหลัง badge/tag อ่อน |
| primary-200 | `#fbc9d6` | เส้นขอบ (border) เน้นเบา |
| primary-300 | `#f89db7` | disabled state ของปุ่ม primary |
| primary-400 | `#f36892` | hover ของ primary-500 (สว่างขึ้น) |
| **primary-500** | **`#E50141`** | **สีหลักของแบรนด์** — ปุ่มหลัก, ลิงก์, highlight |
| primary-600 | `#d11541` | hover/active ของปุ่ม primary-500 |
| primary-700 | `#b01038` | active/pressed state เข้มขึ้น |
| primary-800 | `#930f35` | ข้อความบนพื้นหลังอ่อน (ต้องการ contrast สูง) |
| primary-900 | `#7d0f31` | ข้อความเข้มสุด/heading พิเศษ |

### Neutral (Gray) — ตาม Tailwind default ที่ template ใช้อยู่แล้ว

ใช้ Tailwind `gray` scale มาตรฐาน (ไม่ custom) — เอกสาร template ใช้จริงที่ `gray-200`
(เส้นขอบ/loading spinner), `gray-600` (ข้อความรอง), `gray-700` (ข้อความปกติ) และ `white`
(พื้นหลังหลักของ Navbar/การ์ด)

### สีเชิงความหมาย (Semantic — เพิ่มใหม่ ยังไม่มีใน template ต้นทาง)

Template อ้างอิงยังไม่มีสีสถานะเชิงความหมายกำหนดไว้ (เป็น starter template ทั่วไป) เนื่องจากระบบนี้
มีสถานะงาน (Task) หลายสถานะที่ต้องสื่อความหมายด้วยสี จึงเพิ่มชุดสีมาตรฐานของ Tailwind
(ไม่ custom hex เพื่อให้ปรับเปลี่ยนภายหลังง่าย และไม่ชนกับ primary ของแบรนด์):

| Token | Tailwind class อ้างอิง | การใช้งาน | ตัวอย่างสถานะงานที่ใช้ |
|-------|--------------------------|-----------|--------------------------|
| success | `green-500` / `green-100` (พื้นหลังอ่อน) | สำเร็จ/อนุมัติแล้ว | "รอดำเนินการ" (หลังอนุมัติ) |
| warning | `amber-500` / `amber-100` | รอดำเนินการ/ต้องรอการตัดสินใจ | "รออนุมัติ" |
| danger | `red-500` / `red-100` | ผิดพลาด/ถูกปฏิเสธ/ลบ | "ถูกปฏิเสธ" |
| info | `blue-500` / `blue-100` | ข้อมูลทั่วไป/แจ้งเตือนที่เป็นกลาง | Notification ทั่วไป |

**หมายเหตุ:** template ต้นทางใช้ Tailwind `red-500` ปนกับ `primary-500` ในบางจุด (เช่นปุ่ม
"ออกจากระบบ") ซึ่งใกล้เคียงกันมากจนแยกยากด้วยสายตา — ใน Prototype ของโปรเจกต์นี้ ให้ใช้
`primary-500` เฉพาะ action หลักของแบรนด์ (ปุ่มยืนยัน, ลิงก์) และใช้ `danger` (`red-500` มาตรฐาน)
เฉพาะ action ทำลาย/ปฏิเสธ/ออกจากระบบ เพื่อไม่ให้สื่อความหมายสับสน

## ตัวอักษร (Typography)

- **Font family:** `Prompt` (Google Fonts) — รองรับภาษาไทยเต็มรูปแบบ ตามที่ `react-template-main`
  โหลดผ่าน `index.html`: `Prompt:wght@300;400;500;600;700` — fallback: `sans-serif`
- **Font weight ที่มีให้ใช้:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold),
  700 (Bold)
- **ระดับขนาด (แนะนำตาม Tailwind scale มาตรฐาน เพราะ template ไม่ได้ custom เพิ่ม):**

| ระดับ | Tailwind class | น้ำหนัก | การใช้งาน |
|-------|-----------------|---------|-----------|
| Heading 1 | `text-2xl` (1.5rem) | 700 (Bold) | ชื่อหน้า/หัวข้อหลัก |
| Heading 2 | `text-xl` (1.25rem) | 700 (Bold) | หัวข้อรอง (เช่น "React Template" ใน Navbar ต้นทาง) |
| Body | `text-base` (1rem) | 400 (Regular) | เนื้อหาทั่วไป |
| Body Small | `text-sm` (0.875rem) | 400/500 | ข้อความรอง, label, badge |
| Caption | `text-xs` (0.75rem) | 400 | timestamp, helper text |

## ระยะห่าง/Grid (Spacing)

ใช้ Tailwind spacing scale มาตรฐาน (ไม่ custom) ตามที่ template ใช้จริง:
- Container หลัก: `max-w-7xl` + `mx-auto` + padding แนวนอน `px-4 sm:px-6 lg:px-8` (responsive)
- ความสูงแถบบน (Navbar): `h-16`
- ระยะห่างระหว่างองค์ประกอบแนวนอน: `space-x-4`
- Card/section padding: `p-4`–`p-6` ตามขนาดเนื้อหา

## องค์ประกอบ UI หลัก (Core Components)

อ้างอิงจาก component ที่มีอยู่จริงใน `react-template-main/src/components/`:

- **Navbar** (`Navbar.tsx`): พื้นหลังขาว + shadow (`shadow-md`), โลโก้/ชื่อระบบสีซ้าย
  (`text-primary-500 font-bold`), ข้อมูลผู้ใช้ + ปุ่ม action ขวา
- **ปุ่ม (Button):**
  - Primary: พื้นหลัง `primary-500`, ตัวอักษรขาว, hover → `primary-600`, bo-rder-radius มาตรฐาน
    (`rounded`)
  - Danger/Destructive: พื้นหลัง `red-500` (Tailwind มาตรฐาน ไม่ใช่ primary), hover → `red-600`
  - ขนาดมาตรฐาน: padding `px-4 py-2`, ตัวอักษร `text-sm font-medium`
- **Loading** (`Loading.tsx`): spinner ทรงกลมหมุน ใช้ `border-t-primary-500` บนพื้น
  `border-gray-200`, มีข้อความประกอบใต้ spinner (default: "กำลังโหลด...")
- **Error Boundary** (`ErrorBoundary.tsx`): แสดงข้อความ error อย่างเป็นมิตร ไม่ expose stack
  trace ให้ผู้ใช้ปลายทาง
- **Status Badge (เพิ่มใหม่สำหรับระบบนี้):** ยังไม่มีใน template ต้นทาง ให้ใช้สีเชิงความหมาย
  ข้างต้น (warning/success/danger) ทำเป็น pill/badge พื้นหลังอ่อน + ข้อความสีเข้มของสีเดียวกัน
  (เช่น "รออนุมัติ" = พื้นหลัง `amber-100` + ข้อความ `amber-800`)

## Accessibility / Touch Target

- ปุ่มและ interactive element ทั้งหมดต้องมีขนาดพื้นที่กดขั้นต่ำ 44×44px (มาตรฐาน touch target)
  แม้ padding ที่ template ใช้ (`px-4 py-2`) จะให้พื้นที่ใกล้เคียงแล้ว ให้ตรวจสอบเพิ่มบนมือถือ
- Contrast: ข้อความบน `primary-500` (#E50141) ต้องใช้สีขาวเสมอ (ตรวจสอบแล้วผ่านเกณฑ์ WCAG AA
  สำหรับข้อความขนาดปกติ) หลีกเลี่ยงข้อความสีเข้ม (เช่น `primary-800`/`900`) บนพื้นหลัง `primary-500`
  โดยตรง
- ทุก interactive element ต้องมี focus state ที่มองเห็นได้ชัด (ไม่ปิด outline โดยไม่มี
  alternative)
- สีสถานะ (warning/success/danger) ต้องมีข้อความ/ไอคอนประกอบเสมอ ห้ามสื่อความหมายด้วยสีเพียง
  อย่างเดียว (สำหรับผู้ใช้ที่มีภาวะตาบอดสี)

## เอกสารที่เกี่ยวข้อง

- [[technology-stack]]
- [[feature-list]]
- [[user-journey]]
