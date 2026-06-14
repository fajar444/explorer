<div align="center">

# 🗂️ Explorer

### Pengelola berkas (file manager) modern bergaya Windows Explorer untuk web, pohon folder tanpa batas kedalaman, penyimpanan berkas nyata, pratinjau, unggah, dan kotak sampah.

[« English](README.md) · **Bahasa Indonesia**

<p>
  <img alt="Bun" src="https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white" />
  <img alt="Elysia" src="https://img.shields.io/badge/Elysia-1.x-blueviolet" />
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white" />
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle_ORM-0.38-c5f74f" />
  <img alt="Scalar" src="https://img.shields.io/badge/Dokumentasi_API-Scalar-1a1a1a" />
</p>

<img src="docs/images/screenshot-light.png" alt="Explorer - tema terang" width="49%" />
<img src="docs/images/screenshot-dark.png" alt="Explorer - tema gelap" width="49%" />

</div>

---

## 📖 Daftar Isi

- [Tentang](#-tentang)
- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Arsitektur](#-arsitektur)
- [Struktur Proyek](#-struktur-proyek)
- [Memulai](#-memulai)
  - [Prasyarat](#prasyarat)
  - [Instalasi (dari git clone)](#instalasi-dari-git-clone)
  - [Penyiapan basis data](#penyiapan-basis-data)
  - [Menjalankan aplikasi](#menjalankan-aplikasi)
- [Panduan Penggunaan](#-panduan-penggunaan)
- [Dokumentasi API (Scalar)](#-dokumentasi-api-scalar)
- [Pengujian](#-pengujian)
- [Daftar Skrip](#-daftar-skrip)
- [Penulis](#-penulis)

---

## 🎯 Tentang

**Explorer** adalah aplikasi web yang menghadirkan kembali pengalaman Windows Explorer / pohon berkas pada IDE modern. Layar terbagi menjadi dua panel:

- **Panel kiri** - seluruh struktur folder sebagai pohon interaktif yang bisa dibuka/tutup. Folder dapat bersarang **tanpa batas kedalaman**.
- **Panel kanan** - isi (sub-folder **dan** berkas) dari folder yang dipilih di kiri.

Aplikasi ini adalah pengelola berkas lengkap dengan **penyimpanan berkas nyata**: byte berkas disimpan di disk, sedangkan struktur dan metadata di PostgreSQL. Anda dapat menjelajah, mencari, membuat, mengganti nama, memindahkan, menyalin, mengunggah, mengunduh, melihat pratinjau, mengekstrak arsip, dan memulihkan item terhapus dari kotak sampah - semuanya melalui antarmuka yang bersih dan responsif dengan tema terang dan gelap.

---

## ✨ Fitur

### Menjelajah
- 🌳 **Pohon folder tanpa batas kedalaman** dibangun dari nol (tanpa pustaka tree/treeview) dengan buka/tutup mandiri per baris.
- 📂 **Tata letak dua panel** - klik folder untuk melihat sub-folder dan berkasnya; breadcrumb menampilkan jalur saat ini.
- 🔎 **Pencarian langsung** folder dan berkas berdasarkan nama, tiap hasil menampilkan jalur lengkapnya.

### Pengelolaan berkas
- ⬆️ **Unggah** - lewat tombol atau dengan **menyeret berkas dari komputer** ke jendela, dengan bilah progres langsung.
- 👁️ **Panel pratinjau** - melihat **gambar, PDF, video, audio, dan teks/kode** secara inline (video & audio mendukung streaming range); klik dua kali berkas untuk membukanya.
- ⬇️ **Unduh** berkas apa pun.
- 🗂️ **Buat / Ganti nama / Pindah / Salin / Tempel** - folder dan berkas, satuan maupun massal.
- 🖱️ **Pilih banyak** - klik, Ctrl/⌘-klik, Shift-rentang, Pilih-semua, dan **seleksi kotak (marquee)**, dengan **menu klik kanan**.
- ✋ **Seret untuk memindah** - seret pilihan ke folder mana pun, di grid maupun di pohon.
- 🗑️ **Kotak Sampah** - penghapusan masuk ke sampah dulu; **pulihkan** ke lokasi asal, **hapus permanen**, atau **kosongkan**.
- 🗜️ **Ekstraksi arsip** - mengekstrak `.zip`, `.rar`, dan `.7z` langsung di aplikasi tanpa alat eksternal (ditangani sepenuhnya dengan WebAssembly).

### Pengalaman
- 🎨 **Design system rapi** - tema terang & gelap (tersimpan, tanpa kedip), bayangan lembut, mikro-interaksi, skeleton loader, tampilan grid/list.
- 🧭 **Tur berpemandu bawaan** - klik **?** di header untuk memulai panduan animasi setiap fitur.
- 📱 **Sepenuhnya responsif** - tata letak tablet/ponsel yang rapi dengan laci pohon geser.
- ♿ **Aksesibel** - peran ARIA, tombol nyata, kontrol bisa difokus keyboard, dukungan reduced-motion.
- 🖼️ **Material Design Icons** dirender sebagai SVG inline.

---

## 🛠 Teknologi

| Lapisan | Teknologi |
|------|------------|
| **Runtime / package manager / test runner** | [Bun](https://bun.sh) |
| **Framework backend** | [Elysia](https://elysiajs.com) |
| **Bahasa** | TypeScript |
| **Basis data** | PostgreSQL |
| **ORM & migrasi** | [Drizzle ORM](https://orm.drizzle.team) |
| **Dokumentasi API** | [Scalar](https://scalar.com) (OpenAPI) |
| **Framework frontend** | [Vue 3](https://vuejs.org) (Composition API) |
| **Manajemen state** | [Pinia](https://pinia.vuejs.org) |
| **Build tool** | [Vite](https://vite.dev) |
| **Ikon** | [`@mdi/js`](https://pictogrammers.com/library/mdi/) |
| **Tur berpemandu** | [driver.js](https://driverjs.com) |
| **Pengujian** | `bun:test`, [Vitest](https://vitest.dev), [@vue/test-utils](https://test-utils.vuejs.org), [Playwright](https://playwright.dev) |

---

## 🏛 Arsitektur

Backend mengikuti **Arsitektur Hexagonal (Clean)** - ketergantungan mengarah ke dalam, sehingga logika inti tidak pernah bergantung pada basis data atau framework web.

```
            ┌───────────────────────────────────────────────┐
            │                 PRESENTATION                  │
            │        Rute Elysia (/api/v1/nodes/*)          │
            └───────────────────────┬───────────────────────┘
                                    │ bergantung pada
            ┌───────────────────────▼───────────────────────┐
            │                 APPLICATION                   │
            │   NodeService · NodeWriteService (use-case)   │
            └───────────────────────┬───────────────────────┘
                                    │ bergantung pada (antarmuka)
            ┌───────────────────────▼───────────────────────┐
            │                    DOMAIN                     │
            │        Entity + port (INodeRepository,        │
            │       IStorageService, IArchiveService)       │
            └───────────────────────▲───────────────────────┘
                                    │ diimplementasikan oleh
            ┌───────────────────────┴───────────────────────┐
            │                INFRASTRUCTURE                 │
            │    Repository Drizzle · penyimpanan disk ·    │
            │      layanan arsip · koneksi PostgreSQL       │
            └───────────────────────────────────────────────┘
```

- **Domain** - tipe murni dan "port" antarmuka tanpa ketergantungan apa pun.
- **Application** - logika bisnis (`NodeService` untuk baca, `NodeWriteService` untuk tulis/berkas), hanya bergantung pada port.
- **Infrastructure** - adapter: repository Drizzle, penyimpanan disk, dan layanan arsip.
- **Presentation** - rute Elysia yang menghubungkan HTTP ke layanan aplikasi.

**Frontend** mencerminkan pemisahan yang sama: `types` → `services` (klien API) → `stores` (state Pinia) → `components`, dengan `composables` dan `utils` untuk logika bersama. Pohon folder dibuat sebagai komponen rekursif buatan sendiri.

---

## 📁 Struktur Proyek

```
explorer/                       # Monorepo Bun
├── backend/                    # REST API (Bun + Elysia + Drizzle + PostgreSQL)
│   ├── src/
│   │   ├── domain/             # entity + port (antarmuka)
│   │   ├── application/        # layanan (use-case)
│   │   ├── infrastructure/     # repo Drizzle, penyimpanan, arsip, db
│   │   └── presentation/       # rute Elysia
│   ├── tests/                  # unit + integrasi
│   ├── seed.ts                 # seeder basis data + berkas contoh
│   └── storage/                # byte berkas (dihasilkan, di-git-ignore)
├── frontend/                   # SPA (Vue 3 + Pinia + Vite)
│   └── src/
│       ├── components/         # UI (termasuk pohon rekursif buatan sendiri)
│       ├── stores/             # store Pinia
│       ├── services/           # klien API
│       ├── composables/        # tema, tur, debounce
│       └── utils/              # ikon, format, deteksi pratinjau
├── sample_file/                # berkas contoh yang diimpor seeder
└── docs/images/                # tangkapan layar
```

---

## 🚀 Memulai

### Prasyarat

| Alat | Versi | Catatan |
|------|---------|-------|
| [Bun](https://bun.sh/docs/installation) | ≥ 1.3 | runtime, package manager & test runner |
| [PostgreSQL](https://www.postgresql.org/download/) | ≥ 14 | instans lokal yang berjalan |

> **Pasang Bun di Windows:** `powershell -c "irm bun.sh/install.ps1 | iex"`

### Instalasi (dari git clone)

```bash
# 1. Kloning repositori
git clone https://github.com/fajar444/explorer.git explorer
cd explorer

# 2. Pasang semua dependensi workspace (backend + frontend) dari root
bun install
```

### Penyiapan basis data

```bash
# 1. Buat basis data
psql -U postgres -c "CREATE DATABASE explorer_db;"

# 2. Konfigurasi koneksi backend
cd backend
cp .env.example .env
#   lalu sunting .env agar DATABASE_URL sesuai kredensial PostgreSQL Anda, mis.:
#   DATABASE_URL=postgresql://postgres:KATA_SANDI_ANDA@localhost:5432/explorer_db

# 3. Terapkan skema (membuat tabel `nodes` + indeks)
bun run db:migrate

# 4. Isi basis data + impor berkas contoh ke penyimpanan
bun run db:seed
```

> `bun run db:seed` (atau `bun run db:reset`) melakukan **reset bersih**: mengosongkan tabel dan folder penyimpanan, membangun ulang pohon folder, dan mengimpor setiap berkas dari `sample_file/` ke `Desktop/Samples/` agar Anda langsung punya konten nyata yang bisa dipratinjau.

Lalu konfigurasi frontend:

```bash
cd ../frontend
cp .env.example .env
#   isi .env:
#   VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Menjalankan aplikasi

Buka **dua terminal**:

```bash
# Terminal 1 - Backend → http://localhost:3000
cd backend
bun run dev
#   API  : http://localhost:3000/api/v1
#   Docs : http://localhost:3000/docs   (Scalar)
```

```bash
# Terminal 2 - Frontend → http://localhost:5173
cd frontend
bun run dev
```

Buka **http://localhost:5173**.

> **Tip Windows PowerShell:** PowerShell tidak mendukung `&&`. Jalankan tiap perintah di baris terpisah, atau gunakan `;` di antaranya.

---

## 🖱 Panduan Penggunaan

| Aksi | Hasil |
|--------|--------|
| Klik folder di pohon | Membukanya dan membuka / menutup folder tersebut |
| Klik folder di grid | Membukanya; panel kanan menampilkan isinya |
| Klik panah di pohon | Membuka / menutup folder tersebut |
| Klik dua kali folder | Masuk ke dalamnya |
| Klik berkas | Membukanya di panel pratinjau |
| Klik / Ctrl-klik / Shift-klik | Pilih / alihkan / pilih-rentang item |
| Seret kotak di ruang kosong | Seleksi banyak item (marquee) |
| Klik kanan item atau ruang kosong | Menu konteks (buka, potong, salin, tempel, ganti nama, hapus, ekstrak…) |
| Seret pilihan ke folder | Memindahkan item ke sana |
| Seret berkas dari komputer | Mengunggahnya ke folder saat ini |
| Kotak pencarian | Mencari folder dan berkas berdasarkan nama |
| Kotak Sampah (toolbar pohon) | Pulihkan, hapus permanen, atau kosongkan |
| Ikon **?** (kanan atas) | Membuka menu bantuan dan tur berpemandu |
| Ikon tema (kanan atas) | Mengganti terang / gelap |
| `Ctrl + C` / `Ctrl + X` / `Ctrl + V` | Menyalin, memotong, dan menempel item terpilih |
| `Ctrl + Z` | Mengurungkan (undo) aksi ganti nama, pindah, atau hapus terakhir |
| `Delete` / `Shift + Delete` | Memindahkan pilihan ke kotak sampah / menghapus permanen |

---

## 📡 Dokumentasi API (Scalar)

Dokumentasi API interaktif dihasilkan dari spesifikasi OpenAPI dan dirender dengan **[Scalar](https://scalar.com)**. Saat backend berjalan, buka:

```
http://localhost:3000/docs
```

Dokumentasi diawali dengan **Pendahuluan** yang menjelaskan API, konvensi, dan kelompok sumber daya, diikuti setiap endpoint lengkap dengan skema request/response yang bisa dicoba langsung di peramban.

> URL dasar: `http://localhost:3000/api/v1` · Respons berupa JSON dibungkus `{ "data": ... }`.

| Metode | Endpoint | Deskripsi |
|--------|----------|-------------|
| `GET` | `/nodes/tree` | Seluruh pohon folder |
| `GET` | `/nodes/:id/children` | Anak langsung sebuah folder |
| `GET` | `/nodes/search?q=` | Cari berdasarkan nama |
| `GET` | `/nodes/trash` | Daftar item kotak sampah |
| `GET` | `/nodes/:id/content` | Streaming berkas (mendukung range; `?disposition=attachment` untuk mengunduh) |
| `POST` | `/nodes/folder` | Membuat folder |
| `PATCH` | `/nodes/:id` | Ganti nama / pindah node |
| `POST` | `/nodes/move` · `/nodes/copy` | Pindah / salin node (massal) |
| `POST` | `/nodes/upload` | Unggah berkas (multipart) |
| `POST` | `/nodes/:id/extract` | Mengekstrak arsip |
| `POST` | `/nodes/trash` · `/restore` · `/permanent-delete` · `/trash/empty` | Operasi kotak sampah |

---

## 🧪 Pengujian

Proyek ini dilengkapi pengujian unit, integrasi, komponen, dan end-to-end.

### 1. Pengujian unit backend

```bash
cd backend
bun run test:unit
```

Contoh keluaran:

```
bun test v1.3

 src/.../path.util.test.ts:
 ✓ joinPath > joins under a root
 ...
 42 pass
 0 fail
 Ran 42 tests across 6 files.
```

### 2. Pengujian integrasi backend

Pengujian ini memanggil API langsung, jadi jalankan server lebih dulu (di terminal lain) dengan basis data sudah di-seed:

```bash
# Terminal 1
cd backend
bun run dev

# Terminal 2
cd backend
bun run test:integration
```

Contoh keluaran:

```
 ✓ GET /api/v1/nodes/tree > returns 6 root folders
 ✓ folder lifecycle: create → rename → trash → restore → permanent-delete
 21 pass
 0 fail
```

### 3. Pengujian unit & komponen frontend

```bash
cd frontend
bun run test
```

Contoh keluaran:

```
 ✓ src/stores/explorerStore.test.ts (37 tests)
 ✓ src/components/TreeNode.spec.ts (6 tests)
 ...
 Test Files  11 passed (11)
      Tests  88 passed (88)
```

### 4. Pengujian end-to-end frontend (Playwright)

Dengan backend berjalan dan sudah di-seed:

```bash
cd frontend
bunx playwright test
```

Contoh keluaran:

```
Running 8 tests using 1 worker
 ✓ explorer.spec.ts ...
 ✓ file-manager.spec.ts ...
 ✓ real-files.spec.ts ...
 8 passed
```

### Menulis pengujian unit sendiri

Pengujian backend memakai test runner bawaan Bun. Buat berkas berakhiran `.test.ts` di `backend/tests/unit/`:

```typescript
import { describe, it, expect } from 'bun:test';
import { joinPath } from '../../src/application/path.util';

describe('joinPath', () => {
  it('menggabungkan nama di bawah jalur induk', () => {
    expect(joinPath('/Documents', 'Projects')).toBe('/Documents/Projects');
  });
});
```

Jalankan dengan `bun test tests/unit/berkas-anda.test.ts`. Saat lulus akan tercetak `1 pass / 0 fail`; bila sebuah assertion gagal, akan tercetak nilai yang diharapkan vs. diterima dan kode keluar non-nol.

Pengujian frontend memakai Vitest dengan API `describe / it / expect` yang sama (nama berkas berakhiran `.test.ts` atau `.spec.ts`); jalankan dengan `bun run test`.

---

## 📜 Daftar Skrip

### Backend (`cd backend`)
| Skrip | Deskripsi |
|--------|-------------|
| `bun run dev` | Menjalankan API dengan hot reload |
| `bun run start` | Menjalankan API |
| `bun run db:generate` | Membuat migrasi Drizzle dari skema |
| `bun run db:migrate` | Menerapkan migrasi |
| `bun run db:seed` / `bun run db:reset` | Reset + seed basis data dan berkas contoh |
| `bun run test` · `test:unit` · `test:integration` | Menjalankan pengujian |

### Frontend (`cd frontend`)
| Skrip | Deskripsi |
|--------|-------------|
| `bun run dev` | Menjalankan server dev Vite |
| `bun run build` | Type-check + build produksi |
| `bun run preview` | Pratinjau build produksi |
| `bun run type-check` | Pemeriksaan tipe dengan `vue-tsc` |
| `bun run test` | Pengujian unit & komponen (Vitest) |
| `bun run test:e2e` | Pengujian end-to-end (Playwright) |

---

## 👤 Penulis

**Fajar Iryanto Putra**

---

<div align="center">
Dibuat dengan Bun, Elysia, Vue 3 & PostgreSQL.
</div>
