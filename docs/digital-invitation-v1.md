# NVM Dijital Davetiye v1 — Teknik Operasyon Rehberi

## Mimari Genel Bakış

```
*.nvmedya.com (wildcard)
        ↓
Vercel host-aware rewrite
        ↓
api/invitation.js (Vercel Function)
        ↓
hostname → slug çıkarma → güvenlik doğrulama
        ↓
data/invitations/<slug>.json
        ↓
templates/invitation.html + config → server-side render
        ↓
HTML response (200 veya 404)
```

## Dosya Yapısı

```
/api/invitation.js          → Vercel Function (routing + render)
/templates/invitation.html  → Ortak davetiye HTML template
/data/invitations/          → Çift bazında JSON config dosyaları
/docs/digital-invitation-v1.md → Bu doküman
```

---

## Yeni Çift Nasıl Eklenir?

### 1. Slug Formatı

```
<gelin-adi>-<damat-adi>-<gun>-<ay>-<yil>
```

Örnekler:
- `hatice-mustafa-13-11-2026`
- `ayse-mehmet-15-06-2027`

Kurallar:
- Yalnızca küçük harf, rakam ve tire
- Tire ile başlayamaz / bitemez
- Boşluk, Türkçe karakter, büyük harf kullanılmaz

### 2. Config Dosyası Oluştur

`data/invitations/<slug>.json` dosyası oluştur. Tüm alanlar:

```json
{
  "slug": "<slug>",
  "couple": {
    "bride": "Gelin Adı",
    "groom": "Damat Adı",
    "displayName": "Gelin & Damat"
  },
  "date": {
    "display": "1 Ocak 2027 Cumartesi",
    "short": "1 Ocak 2027",
    "dayOfWeek": "Cumartesi",
    "iso": "2027-01-01",
    "time": "19:00",
    "timezone": "Europe/Istanbul",
    "isoStart": "2027-01-01T16:00:00Z",
    "isoEnd": "2027-01-01T21:00:00Z",
    "countdownTarget": "2027-01-01T19:00:00+03:00"
  },
  "hero": {
    "message": "Sizi, hayatımızın en özel gününü birlikte kutlamaya davet ediyoruz.",
    "backgroundImage": "https://ik.imagekit.io/nvmedya/davetiye/<çift-hero>.jpeg"
  },
  "venue": {
    "name": "Mekan Adı",
    "address": "Tam Adres",
    "addressLine1": "Mahalle, Sokak, No",
    "addressLine2": "İlçe / İl",
    "addressShort": "İlçe / İl",
    "city": "İl",
    "image": "https://ik.imagekit.io/nvmedya/davetiye/<mekan>.jpeg",
    "imageAlt": "Mekan adı - İl",
    "mapsUrl": "https://www.google.com/maps/place/...",
    "description": "Düğün organizasyonumuz ... gerçekleşecektir."
  },
  "timeline": [
    { "time": "18:30", "title": "Misafir Karşılama" },
    { "time": "19:00", "title": "Nikah Töreni" }
  ],
  "gallery": ["thumb_url_1", "thumb_url_2"],
  "galleryFullRes": ["full_url_1", "full_url_2"],
  "rsvp": {
    "formId": "<Google Form ID>",
    "formAction": "https://docs.google.com/forms/d/e/<formId>/formResponse",
    "entries": {
      "name": "entry.XXXXXXXXX",
      "attendance": "entry.XXXXXXXXX",
      "adults": "entry.XXXXXXXXX",
      "hasChildren": "entry.XXXXXXXXX",
      "children": "entry.XXXXXXXXX",
      "message": "entry.XXXXXXXXX"
    }
  },
  "messages": {
    "letterText": "Davet mektubu metni...",
    "finalText": "Son mesaj metni..."
  },
  "calendar": {
    "googleCalUrl": "https://calendar.google.com/calendar/render?action=TEMPLATE&...",
    "ics": {
      "uid": "<slug>@nvmedya.com",
      "dtstart": "20270101T160000Z",
      "dtend": "20270101T210000Z",
      "summary": "Gelin & Damat Düğün Daveti",
      "description": "Kısa açıklama",
      "location": "Mekan, Adres",
      "filename": "Gelin-Damat-Dugun-Davetiye.ics"
    }
  }
}
```

### 3. ImageKit Fotoğrafları

Fotoğrafları `https://ik.imagekit.io/nvmedya/davetiye/` altına yükle.

- Hero fotoğrafı: `<çift-adi>-hero.jpeg`
- Mekan fotoğrafı: `<mekan-adi>.jpeg`
- Galeri fotoğrafları: `<çift-adi>-1.jpeg`, `<çift-adi>-2.jpeg`, ...

### 4. Deploy

```bash
git add data/invitations/<slug>.json
git commit -m "feat: add <çift-adi> invitation config"
git push origin main
npx vercel --prod --yes
```

### 5. Test

```
https://<slug>.nvmedya.com
```

**DNS'e girmek gerekmez.** Wildcard `*.nvmedya.com` zaten Vercel'e yönlendirilmiştir.

**Vercel Domains'e yeni subdomain eklemek gerekmez.** Wildcard routing otomatik çalışır.

**Yeni HTML dosyası oluşturmak gerekmez.** Ortak template kullanılır.

---

## Yeni Google Form Nasıl Bağlanır?

### 1. Google Form Oluştur

6 soru:
1. **Ad Soyad** (Kısa cevap, zorunlu)
2. **Katılım Durumu** (Çoktan seçmeli: "Katılacağım", "Katılamayacağım", zorunlu)
3. **Yetişkin Kişi Sayısı** (Kısa cevap, zorunlu)
4. **Çocuk misafiriniz olacak mı?** (Çoktan seçmeli: "Evet", "Hayır", zorunlu)
5. **Çocuk Kişi Sayısı** (Kısa cevap)
6. **Çiftimize mesajınız** (Paragraf)

### 2. Entry ID Nasıl Çıkarılır?

```bash
curl -sL 'https://docs.google.com/forms/d/e/<FORM_ID>/viewform' \
  | grep 'FB_PUBLIC_LOAD_DATA_'
```

Bu JSON blob içinde her soru için `[ID, "Soru Metni", ...]` formatında veri bulunur. İç içe dizilerdeki ilk sayısal değer entry ID'dir.

Örnek eşleştirme:
```
[993359809, "Ad Soyad", ...[[1841629922, ...]]]
→ entry.1841629922
```

### 3. Config'e Yaz

```json
"rsvp": {
  "formId": "<form-id>",
  "formAction": "https://docs.google.com/forms/d/e/<form-id>/formResponse",
  "entries": {
    "name": "entry.<ad-soyad-id>",
    "attendance": "entry.<katilim-id>",
    "adults": "entry.<yetiskin-id>",
    "hasChildren": "entry.<cocuk-soru-id>",
    "children": "entry.<cocuk-sayi-id>",
    "message": "entry.<mesaj-id>"
  }
}
```

### 4. LCV Testi

Formdan test kaydı gönderin ve Google E-Tabloyu kontrol edin.

---

## 404 Mantığı

- **Bilinen slug** (`data/invitations/<slug>.json` mevcut) → HTTP 200 + davetiye
- **Bilinmeyen slug** (config bulunamadı) → **gerçek HTTP 404**
- **Reserved slug** (www, mail, admin, api...) → HTTP 404
- **Geçersiz format** (path traversal, nested subdomain) → HTTP 404

404 sayfası minimal bir NVM markalı "Sayfa bulunamadı" sayfasıdır. Ana site içeriğini expose etmez.

---

## noindex Politikası

Tüm davetiye sayfaları varsayılan olarak **özel müşteri sayfalarıdır**.

### HTML Meta
```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
<meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet">
```

### HTTP Header
```
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
```

### Sitemap
Davetiye URL'leri sitemap.xml'e **eklenmez**.

---

## DNS Notu

DNS wildcard `*.nvmedya.com` Vercel DNS üzerinden global olarak yapılandırılmıştır.

**Yeni çiftte DNS değişikliği yapılmamalıdır.**

Nameserver'lar:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Wildcard SSL Vercel tarafından otomatik yönetilir.
