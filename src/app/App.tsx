import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "../ui/AppHeader";
import { paths } from "./routes";

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
    <>
      <AppHeader />
      <Routes>
        <Route path={paths.gallery} element={<Placeholder title="Galeri" />} />
        <Route path={paths.photo(":id")} element={<Placeholder title="Fotoğraf seç" />} />
        <Route path={paths.editor(":id")} element={<Placeholder title="Stil" />} />
        <Route path={paths.result(":id")} element={<Placeholder title="Sonuç" />} />
        <Route path={paths.privacy} element={<Placeholder title="Gizlilik" />} />
        <Route path={paths.account} element={<Placeholder title="Hesap" />} />
        <Route path="*" element={<Navigate to={paths.gallery} replace />} />
      </Routes>
    </>
  );
}
