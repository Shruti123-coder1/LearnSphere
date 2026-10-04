import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, Printer } from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getCertificate, generateCertificate } from "../services/enrollmentService";
import { getErrorMessage } from "../services/api";

export default function Certificate() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        let res;
        try {
          res = await getCertificate(courseId);
        } catch (err) {
          if (err.response?.status === 404) res = await generateCertificate(courseId);
          else throw err;
        }
        if (!ignore) setCert(res.certificate);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err, "Certificate is not available yet"));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  if (loading) return <Loading fullPage text="Preparing your certificate..." />;

  if (error || !cert) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Certificate not available"
          message={error || "Complete 100% of the course to get your certificate."}
          action={<Button to={`/learn/${courseId}`}>Continue learning</Button>}
        />
      </div>
    );
  }

  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4 landscape; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; } }`}</style>

      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between print:hidden">
        <Link
          to="/my-learning"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-brand-700"
        >
          <ArrowLeft size={16} /> My learning
        </Link>
        <Button onClick={() => window.print()}>
          <Printer size={16} /> Print / Save as PDF
        </Button>
      </div>

      <div className="relative mx-auto aspect-[1.414/1] w-full max-w-5xl bg-white p-3 shadow-xl print:max-w-none print:shadow-none sm:p-4">
        <div className="flex h-full flex-col items-center justify-between border-[6px] border-double border-brand-700 px-4 py-5 text-center sm:border-[10px] sm:px-12 sm:py-10">
          <div>
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-white sm:h-16 sm:w-16">
              <Award className="h-5 w-5 sm:h-8 sm:w-8" />
            </span>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-700 sm:mt-4 sm:text-sm">
              LearnSphere
            </p>
            <h1 className="mt-1 text-xl font-bold text-ink sm:mt-3 sm:text-4xl md:text-5xl">
              Certificate of Completion
            </h1>
          </div>

          <div>
            <p className="text-[10px] text-stone-500 sm:text-base">This is to certify that</p>
            <p className="mt-1 border-b-2 border-brand-300 px-6 pb-1 font-display text-2xl font-bold text-brand-800 sm:mt-3 sm:px-12 sm:pb-2 sm:text-5xl">
              {cert.studentName || user?.name}
            </p>
            <p className="mt-2 text-[10px] text-stone-500 sm:mt-4 sm:text-base">
              has successfully completed the course
            </p>
            <p className="mt-1 font-display text-base font-bold text-ink sm:mt-2 sm:text-3xl">
              {cert.courseTitle}
            </p>
          </div>

          <div className="grid w-full grid-cols-3 items-end gap-2 text-[9px] text-stone-600 sm:text-sm">
            <div>
              <p className="font-semibold text-ink">{issued}</p>
              <div className="mx-auto mt-1 h-px w-16 bg-stone-400 sm:w-32" />
              <p className="mt-1">Date of issue</p>
            </div>
            <div>
              <p className="font-display text-xs font-bold italic text-brand-800 sm:text-xl">
                LearnSphere
              </p>
              <div className="mx-auto mt-1 h-px w-16 bg-stone-400 sm:w-32" />
              <p className="mt-1">Authorised by</p>
            </div>
            <div>
              <p className="font-semibold text-ink">{cert.instructorName || "Instructor"}</p>
              <div className="mx-auto mt-1 h-px w-16 bg-stone-400 sm:w-32" />
              <p className="mt-1">Course instructor</p>
            </div>
          </div>

          <p className="text-[8px] text-stone-500 sm:text-xs">
            Certificate ID: <span className="font-mono font-semibold">{cert.certificateId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}