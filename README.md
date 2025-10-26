# Madlen Case Study · Local Chatbot

Bu proje, OpenRouter üzerindeki ücretsiz modellerle lokal olarak sohbet etmenizi sağlayan fullstack bir uygulamadır. Frontendde Next.js, backendde node.js kullanılmıştır. Trace takibi jaeger ile OpenTelemetry traceleri görselleştirilmiştir. Sohbet geçmişi diskte saklanır; frontendde model seçimi, oturum yönetimi, reasoning gösterimi gibi özellikler sunar.

## Teknik Tercihler

- **Express + TypeScript + OpenTelemetry (Backend):** OpenRouter’a yapılan istekler yönetiliyor ve traceleri takip etmek için Jaeger’a kayıt gönderiliyor.
- **Next.js 16 (App Router) + TypeScript (Frontend):** Yaygın ve modern bir framework olan Next.js kullanıldı
- **Yerel JSON depolama:** Hızlı bir prototip için json olarak depolamak istedim.
- **Jaeger + Docker Compose:** OpenTelemetry trace’lerini görselleştirmek için Jaeger’in all-in-one imajı kullanıldı. Compose dosyası backend, frontend ve Jaeger’ı tek komutla ayağa kaldırıyor.

## Kurulum ve Çalıştırma

1. **Bağımlılıklar:**
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```
   (Monorepo yapısında kök dizinden `npm install` komutu alt paketler için de kurulumu başlatır.)

2. **Ortam Değişkenleri:**
  Backend ve Frontend folderları içerisinde yer alan örnek environment dosyalarından(/backend/env.example, /frontend/env.local.example) '.example' uzantısını kaldırıp başa nokta('.') koyup dosyalar içerisinde de gerekli değişklileri yapmanız gerekiyor.

3. **Geliştirme Modu:**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

4. **Üretime Hazırlık:**
   ```bash
   npm run build
   npm run start -w backend
   npm run start -w frontend
   ```

5. **Docker Compose ile:**
   ```bash
   OPENROUTER_API_KEY=KENDI_API_KEYIN docker compose up --build
   ```
   Bu komut backend, frontend ve Jaeger’ı aynı anda başlatır.

## Jaeger ve Traceler

- Compose dosyası Jaeger’ı `jaegertracing/all-in-one` imajıyla çalıştırır.
- Jaeger UI: http://localhost:16686
- Backend ve frontend, varsayılan olarak `http://localhost:4318/v1/traces` adresine OTLP HTTP üzerinden iz gönderir.
- Uygulamayı kullanırken: Chat, model listeleme, dosya yükleme gibi her API çağrısı otomatik olarak span’ler üretir. Jaeger arayüzünde `jaeger-all-in-one' servisinden trace’leri inceleyebilirsiniz.
  1. Jaeger UI’da *Search* sekmesinde ilgili servisi seçin.
  2. `Find Traces` ile son çağrıları listeleyin.

## Komut Özeti

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Backend ve frontend’i aynı anda geliştirici modunda çalıştırır. |
| `npm run dev:backend` | Sadece backendi geliştirici modunda çalıştırır. |
| `npm run dev:frontend` | Sadece frontendi geliştirici modunda çalıştırır. |
| `npm run build` | Her iki paketi de compile eder. |
| `docker compose up` | Backend + frontend + Jaeger (OpenRouter API anahtarı gerekli). |

## Notlar

- Sohbet geçmişleri `backend/data` altında JSON olarak tutulur; klasör git tarafından takip edilmez (sadece `.gitkeep`).
- Yüklenen görseller `backend/uploads` içinde saklanır ve `http://localhost:4000/uploads/...` üzerinden servis edilir.
- Frontend, tarayıcı tarafında `localStorage` ile seçilen modeli, aktif session ID’yi ve son mesajları cache eder.

Bu adımlarla projeyi lokalinizde çalıştırabilir, OpenRouter üzerinden sohbetler yapabilir ve Jaeger aracılığıyla tüm trace’leri gözlemleyebilirsiniz.


Akademik yoğunluğun üstüne 3 gün içerisinde sıkı bir çalışmayla bu proje ortaya konmuştur.
-Baran Turhan
