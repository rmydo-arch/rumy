# kılık

Telefon öncelikli React web uygulaması: fotoğrafı tarayıcıda, seçilen konsepte göre yeniden stilize eder. Arayüz dili Türkçe (`<html lang="tr">`).

## Kural: fotoğraflar cihazdan çıkmaz
Kullanıcı fotoğrafları yalnızca tarayıcıda işlenir. Hiçbir sunucuya, Firebase'e veya üçüncü tarafa yüklenmez.

## Komutlar
- `npm run dev` geliştirme sunucusu
- `npm run build` tip kontrolü + üretim derlemesi
- `npm test` Vitest (jsdom, Testing Library)
- `npm run typecheck` `tsc --noEmit`
- `npm run e2e` Playwright (mobil profil, dev sunucusunu başlatır)

## Yığın
React 19, TypeScript strict, Vite, React Router, Vitest, Playwright. Yazı tipleri `@fontsource` ile paketlenir (Fraunces 900, Outfit; latin-ext Türkçe için).

## Klasörler
- `src/app/` uygulama kabuğu, yollar (`routes.ts`)
- `src/ui/` tema (`theme.css`) ve ortak bileşenler
- `e2e/` Playwright senaryoları (sonraki görevler ekler)
- `docs/` belgeler
- `spikes/segmentation/` atılabilir deney, kendi package.json'u var; kök derleme, test ve TypeScript dışında, dokunma

## Tasarım kısıtları
Renkler: ink #1F1A17, paper #F7F1E4, surface #FFFBF2, brand #BF4316, ikincil metin #5F5247, hata #A32A12. Dokunma hedefleri en az 44 px. Yazı tipleri Google'dan yüklenmez.

## Belgeler
- [docs/01-brd.md](docs/01-brd.md)
- [docs/02-analiz.md](docs/02-analiz.md)
- [docs/03-plan.md](docs/03-plan.md)
