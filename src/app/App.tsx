import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "../ui/AppHeader";
import { GalleryPage } from "../features/gallery/GalleryPage";
import { UploadPage } from "../features/upload/UploadPage";
import { paths } from "./routes";
import { SessionProvider } from "./session";

// Geçici sayfalar: sonraki görevler gerçek ekranlarla değiştirecek.
function Placeholder({ title }: { title: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
    </main>
  );
}

export function App() {
  return (
    <SessionProvider>
      <AppHeader />
      <Routes>
        <Route path={paths.gallery} element={<GalleryPage />} />
        <Route path={paths.photo(":id")} element={<UploadPage />} />
        <Route path={paths.editor(":id")} element={<Placeholder title="Stil" />} />
        <Route path={paths.result(":id")} element={<Placeholder title="Sonuç" />} />
        <Route path={paths.privacy} element={<Placeholder title="Gizlilik" />} />
        <Route path={paths.account} element={<Placeholder title="Hesap" />} />
        <Route path="*" element={<Navigate to={paths.gallery} replace />} />
      </Routes>
    </SessionProvider>
  );
}
