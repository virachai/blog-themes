# Mee Prompt Theme

Stylesheet for [meeprompt.blogspot.com](https://meeprompt.blogspot.com/). The Blogger theme (a Contempo-style responsive theme) keeps its own layout. [theme.css](theme.css) adds two things on top of it:

1. **Readability for post pages:** Thai-friendly line height, heading rhythm, responsive tables, code blocks and quotes. These rules apply only inside `.post-body`.
2. **Post components** with the `mp-` prefix, used in post HTML (by hand or by the publishing pipeline).

## Components

Paste these into a post in HTML view.

### Summary (top of every post)

The first answer a reader or an AI crawler sees.

```html
<div class="mp-summary">
  <p class="mp-label">สรุปสั้น</p>
  <p>ตอบคำถามหลักของโพสต์ใน 2–3 บรรทัด</p>
</div>
```

### Evidence (first-hand proof)

Shows what was actually tested. Every post must have at least one.

```html
<div class="mp-evidence">
  <p class="mp-label">ทดสอบจริง</p>
  <p>ทดสอบกับใบแจ้งหนี้ 50 ฉบับ ใช้เวลา 6 นาที แก้มือ 2 รายการ</p>
</div>
```

### Call to action (lead magnet)

```html
<div class="mp-cta">
  <p class="mp-cta-title">ดาวน์โหลดชุดเครื่องมือฟรี</p>
  <p>อธิบายสั้นๆ ว่าได้อะไร</p>
  <a class="mp-button" href="https://example.com/kit">รับชุดเครื่องมือ</a>
</div>
```

### Note

```html
<div class="mp-note">ข้อควรระวังหรือเงื่อนไข</div>
```

Wide tables scroll sideways on phones automatically. No wrapper is needed.
