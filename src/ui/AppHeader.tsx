import { useNavigate } from "react-router-dom";
import { paths } from "../app/routes";

export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <button type="button" className="brand" onClick={() => navigate(paths.gallery)}>
        kılık
      </button>
    </header>
  );
}
