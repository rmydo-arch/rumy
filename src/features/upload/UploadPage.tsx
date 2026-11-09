import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../app/routes";
import { useSession } from "../../app/session";
import { getLiveConcept } from "../../concepts/catalog";
import { MAX_EXPORT_EDGE } from "../../engine/limits";
import { decodePhoto, photoErrorMessage, validatePhotoFile, type PhotoError } from "../../engine/photoFile";
import "./upload.css";

export function UploadPage() {
  const { id = "" } = useParams();
  const concept = getLiveConcept(id);
  const navigate = useNavigate();
  const { setPhoto, selection, resetSelection } = useSession();
  const [error, setError] = useState<PhotoError | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busyRef = useRef(false);
  const attemptRef = useRef(0);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    // Leaving the page or switching concept invalidates any decode in flight.
    return () => {
      attemptRef.current += 1;
      busyRef.current = false;
      setBusy(false);
    };
  }, [id]);

  if (!concept) return <Navigate to={paths.gallery} replace />;

  async function pick(file: File | undefined) {
    if (!file || busyRef.current || !concept) return;
    const invalid = validatePhotoFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    busyRef.current = true;
    const attempt = attemptRef.current;
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap;
    try {
      bitmap = await decodePhoto(file, MAX_EXPORT_EDGE);
    } catch {
      if (attempt === attemptRef.current) {
        setError("corrupt");
        busyRef.current = false;
        setBusy(false);
      }
      return;
    }
    if (attempt !== attemptRef.current) {
      bitmap.close();
      return;
    }
    busyRef.current = false;
    setBusy(false);
    setPhoto({ bitmap, width: bitmap.width, height: bitmap.height });
    if (selectionRef.current.conceptId !== concept.id) resetSelection(concept);
    navigate(paths.editor(concept.id));
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    void pick(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files[0]);
  }

  return (
    <main className="page upload">
      <button type="button" className="upload__back" onClick={() => navigate(paths.gallery)}>
        Konseptlere dön
      </button>
      <p className="upload__concept">{concept.name}</p>
      <h1 className="upload__title">{concept.copy.uploadTitle}</h1>
      <label
        className={`upload__drop${dragging ? " upload__drop--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          className="upload__input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
        />
        <span className="upload__pill">Bilgisayarından fotoğraf seç</span>
        <span className="upload__note">ya da buraya sürükle · JPG, PNG, WEBP · en fazla 20 MB</span>
        <span className="upload__note">Fotoğrafların cihazından çıkmaz.</span>
      </label>
      {busy && <p role="status">Fotoğraf hazırlanıyor</p>}
      {error && (
        <p role="alert" className="upload__error">
          {photoErrorMessage[error]}
        </p>
      )}
      <p className="upload__hint">
        En iyi sonuç için yüzü net, iyi ışıklı bir fotoğraf seç. Yalnızca kendi fotoğraflarını ya da izin aldığın kişilerinkini yükle.
      </p>
    </main>
  );
}
