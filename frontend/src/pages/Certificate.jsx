import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getCertificate, generateCertificate } from "../services/enrollmentService";
import { getErrorMessage } from "../services/api";

/* ---------- design tokens ---------- */
const PURPLE = "#7e22ce";
const PURPLE_DARK = "#4c1d95";
const INK = "#1f1535";
const GOLD_TEXT = "#8a6414";
const SERIF = '"Cormorant Garamond", "Fraunces", Georgia, "Times New Roman", serif';
const SCRIPT = '"Great Vibes", "Brush Script MT", "Segoe Script", cursive';

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&display=swap');";

/* ---------- small helpers ---------- */
const starPath = (cx, cy, outer, inner, points = 5) => {
  let d = "";
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
};

const BURST_PATH = starPath(100, 100, 97, 88, 32);
const CENTER_STAR = starPath(100, 100, 25, 10.5, 5);
const SMALL_STAR = starPath(0, 0, 7, 3, 5);

/* ---------- artwork ---------- */
function GoldDefs({ prefix }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f8e9a8" />
        <stop offset="0.35" stopColor="#d9a93a" />
        <stop offset="0.7" stopColor="#a9781f" />
        <stop offset="1" stopColor="#e9c862" />
      </linearGradient>
      <radialGradient id={`${prefix}-disc`} cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#fff7d6" />
        <stop offset="1" stopColor="#e3b64c" />
      </radialGradient>
      <linearGradient id={`${prefix}-purple`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9333ea" />
        <stop offset="1" stopColor="#5b189a" />
      </linearGradient>
    </defs>
  );
}

function CornerOrnament() {
  return (
    <g fill="none" stroke="url(#cbg-gold)" strokeLinecap="round">
      <path d="M64 136 A72 72 0 0 0 136 64" strokeWidth="2.4" />
      <path d="M64 112 A48 48 0 0 0 112 64" strokeWidth="1.4" />
      <path d="M64 92 A28 28 0 0 0 92 64" strokeWidth="1" />
      <circle cx="64" cy="64" r="5" fill="url(#cbg-gold)" stroke="none" />
      <path d="M64 150 L64 168 M150 64 L168 64" strokeWidth="1.6" />
      <circle cx="64" cy="176" r="2.6" fill="url(#cbg-gold)" stroke="none" />
      <circle cx="176" cy="64" r="2.6" fill="url(#cbg-gold)" stroke="none" />
    </g>
  );
}

function Background() {
  const rings = [];
  for (let r = 110; r <= 400; r += 18) rings.push(r);

  return (
    <svg
      viewBox="0 0 1414 1000"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <GoldDefs prefix="cbg" />
      <defs>
        <radialGradient id="cbg-paper" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fbf6e9" />
        </radialGradient>
      </defs>

      <rect width="1414" height="1000" fill="url(#cbg-paper)" />

      {/* soft guilloche rings behind the content */}
      <g fill="none" stroke="#b8892d" strokeOpacity="0.07" strokeWidth="1.2">
        {rings.map((r) => (
          <circle key={r} cx="707" cy="500" r={r} />
        ))}
      </g>

      {/* frame */}
      <rect x="24" y="24" width="1366" height="952" fill="none" stroke={PURPLE_DARK} strokeWidth="14" />
      <rect x="40" y="40" width="1334" height="920" fill="none" stroke="url(#cbg-gold)" strokeWidth="3" />
      <rect x="64" y="64" width="1286" height="872" fill="none" stroke={PURPLE} strokeWidth="1.4" />

      {/* corners */}
      <CornerOrnament />
      <g transform="translate(1414 0) scale(-1 1)">
        <CornerOrnament />
      </g>
      <g transform="translate(0 1000) scale(1 -1)">
        <CornerOrnament />
      </g>
      <g transform="translate(1414 1000) scale(-1 -1)">
        <CornerOrnament />
      </g>
    </svg>
  );
}

function Ribbon() {
  return (
    <svg viewBox="0 0 460 92" className="block w-full" role="img" aria-label="Certificate">
      <GoldDefs prefix="crb" />
      {/* tails */}
      <polygon points="0,26 44,26 44,86 0,86 17,56" fill="#4c1d95" />
      <polygon points="460,26 416,26 416,86 460,86 443,56" fill="#4c1d95" />
      {/* folds */}
      <polygon points="44,70 72,70 44,86" fill="#2e1065" />
      <polygon points="416,70 388,70 416,86" fill="#2e1065" />
      {/* main band */}
      <rect x="44" y="8" width="372" height="62" fill="url(#crb-purple)" />
      <rect x="52" y="15" width="356" height="48" fill="none" stroke="url(#crb-gold)" strokeWidth="1.6" />
      {/* stars */}
      <path d={SMALL_STAR} transform="translate(82 39)" fill="url(#crb-gold)" />
      <path d={SMALL_STAR} transform="translate(378 39)" fill="url(#crb-gold)" />
      <text
        x="230"
        y="49"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="29"
        fontWeight="700"
        letterSpacing="7"
        fontFamily={SERIF}
      >
        CERTIFICATE
      </text>
    </svg>
  );
}

function Seal() {
  return (
    <svg viewBox="0 0 200 250" className="block w-full" role="img" aria-label="LearnSphere seal">
      <GoldDefs prefix="csl" />
      <defs>
        <path id="csl-top" d="M 100 168 A 68 68 0 1 1 100 32 A 68 68 0 1 1 100 168" />
        <path id="csl-bottom" d="M 23 100 A 77 77 0 0 0 177 100" />
      </defs>

      {/* ribbon tails */}
      <polygon points="72,140 48,238 76,222 98,243 106,150" fill="url(#csl-purple)" stroke="#4c1d95" strokeWidth="1" />
      <polygon points="128,140 152,238 124,222 102,243 94,150" fill="#5b189a" stroke="#4c1d95" strokeWidth="1" />

      {/* medal */}
      <path d={BURST_PATH} fill="url(#csl-gold)" stroke="#8a6414" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="81" fill="none" stroke="#fff3c4" strokeWidth="2" />
      <circle cx="100" cy="100" r="78" fill="url(#csl-gold)" />
      <circle cx="100" cy="100" r="62" fill="url(#csl-disc)" stroke="#9a6f1c" strokeWidth="1.6" />

      <text fontSize="10.5" fontWeight="700" letterSpacing="3" fill="#5c3f08" fontFamily={SERIF}>
        <textPath href="#csl-top" startOffset="50%" textAnchor="middle">
          LEARNSPHERE
        </textPath>
      </text>
      <text fontSize="10.5" fontWeight="700" letterSpacing="3" fill="#5c3f08" fontFamily={SERIF}>
        <textPath href="#csl-bottom" startOffset="50%" textAnchor="middle">
          COMPLETION
        </textPath>
      </text>
      <circle cx="27" cy="100" r="2.2" fill="#5c3f08" />
      <circle cx="173" cy="100" r="2.2" fill="#5c3f08" />

      <path d={CENTER_STAR} fill="url(#csl-gold)" stroke="#8a6414" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="mx-auto flex items-center justify-center gap-[1cqw]" style={{ width: "20cqw" }}>
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #b8892d)" }} />
      <svg viewBox="-8 -8 16 16" style={{ width: "1.1cqw", height: "1.1cqw" }} aria-hidden="true">
        <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="#b8892d" />
      </svg>
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, #b8892d, transparent)" }} />
    </div>
  );
}

const SANS = 'Inter, "Segoe UI", Arial, sans-serif';
const STAMP_INK = "#5b21b6";

/* Round "ink" stamp placed over the authorised signature */
function Stamp({ dateText }) {
  return (
    <svg viewBox="0 0 200 200" className="block w-full" role="img" aria-label="LearnSphere stamp">
      <defs>
        <path id="cst-top" d="M 100 168 A 68 68 0 1 1 100 32 A 68 68 0 1 1 100 168" />
        <path id="cst-bottom" d="M 20 100 A 80 80 0 0 0 180 100" />
      </defs>
      <g transform="rotate(-8 100 100)" fill="none" stroke={STAMP_INK} opacity="0.88">
        <circle cx="100" cy="100" r="95" strokeWidth="4" />
        <circle cx="100" cy="100" r="89" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="60" strokeWidth="2" />

        <text fill={STAMP_INK} stroke="none" fontSize="17" fontWeight="800" letterSpacing="3.5" fontFamily={SANS}>
          <textPath href="#cst-top" startOffset="50%" textAnchor="middle">
            LEARNSPHERE
          </textPath>
        </text>
        <text fill={STAMP_INK} stroke="none" fontSize="15" fontWeight="800" letterSpacing="3.5" fontFamily={SANS}>
          <textPath href="#cst-bottom" startOffset="50%" textAnchor="middle">
            AUTHORISED
          </textPath>
        </text>
        <path d={starPath(24, 100, 6.5, 2.8, 5)} fill={STAMP_INK} stroke="none" />
        <path d={starPath(176, 100, 6.5, 2.8, 5)} fill={STAMP_INK} stroke="none" />

        <path d={starPath(100, 74, 6, 2.5, 5)} fill={STAMP_INK} stroke="none" />
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fill={STAMP_INK}
          stroke="none"
          fontSize="19"
          fontWeight="800"
          letterSpacing="1"
          fontFamily={SANS}
        >
          COMPLETED
        </text>
        <line x1="58" y1="114" x2="142" y2="114" strokeWidth="1.6" />
        <text
          x="100"
          y="134"
          textAnchor="middle"
          fill={STAMP_INK}
          stroke="none"
          fontSize="14"
          fontWeight="700"
          letterSpacing="0.5"
          fontFamily={SANS}
        >
          {dateText}
        </text>
      </g>
    </svg>
  );
}

/* A footer field: value on top, line, caption below */
function FooterField({ children, caption, overlay }) {
  return (
    <div className="relative text-center">
      {overlay}
      <div
        style={{
          height: "4.4cqw",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "0.2cqw",
          minWidth: 0,
        }}
      >
        {children}
      </div>
      <div style={{ height: "0.15cqw", background: "#6b5b8a" }} />
      <p
        className="uppercase"
        style={{
          marginTop: "0.5cqw",
          fontSize: "1.05cqw",
          letterSpacing: "0.18em",
          fontWeight: 600,
          color: "#4b4468",
        }}
      >
        {caption}
      </p>
    </div>
  );
}

const scriptSize = (text) => (text.length > 18 ? 2.2 : text.length > 13 ? 2.6 : 3.1);

/* ---------- the certificate sheet ---------- */
export function CertificateSheet({ studentName, courseTitle, instructorName, issuedAt, certificateId }) {
  const issued = new Date(issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stampDate = new Date(issuedAt)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  const nameSize = studentName.length > 28 ? 4.2 : studentName.length > 20 ? 5.2 : 6.4;
  const titleSize = courseTitle.length > 60 ? 2.5 : courseTitle.length > 40 ? 3 : 3.6;

  return (
    <div
      className="cert-sheet relative mx-auto w-full max-w-5xl overflow-hidden bg-white shadow-xl print:max-w-none print:shadow-none"
      style={{ aspectRatio: "1414 / 1000", containerType: "inline-size" }}
    >
      <style>{`${FONT_IMPORT} @media print { .cert-sheet { width: 297mm !important; max-width: none !important; height: 209.4mm !important; aspect-ratio: auto !important; break-inside: avoid; page-break-after: avoid; page-break-inside: avoid; } }`}</style>
      <Background />

      <div
        className="absolute inset-0 flex flex-col items-center justify-between text-center"
        style={{ padding: "5cqw 9cqw 5.2cqw", color: INK }}
      >
        {/* header */}
        <div className="w-full">
          <p
            className="uppercase"
            style={{
              fontSize: "1.2cqw",
              fontWeight: 700,
              letterSpacing: "0.5em",
              color: PURPLE,
              marginBottom: "1cqw",
            }}
          >
            LearnSphere
          </p>
          <div className="mx-auto" style={{ width: "40cqw" }}>
            <Ribbon />
          </div>
          <p
            className="uppercase"
            style={{
              marginTop: "1.2cqw",
              fontFamily: SERIF,
              fontSize: "2cqw",
              fontWeight: 700,
              letterSpacing: "0.45em",
              color: GOLD_TEXT,
              paddingLeft: "0.45em",
            }}
          >
            of Completion
          </p>
        </div>

        {/* body */}
        <div className="w-full">
          <Divider />
          <p style={{ marginTop: "1.6cqw", fontSize: "1.45cqw", color: "#5b5578", letterSpacing: "0.04em" }}>
            This certificate is proudly presented to
          </p>
          <p
            className="mx-auto truncate"
            style={{
              marginTop: "0.6cqw",
              maxWidth: "74cqw",
              fontFamily: SCRIPT,
              fontSize: `${nameSize}cqw`,
              lineHeight: 1.3,
              color: PURPLE_DARK,
            }}
          >
            {studentName}
          </p>
          <div
            className="mx-auto"
            style={{
              width: "46cqw",
              height: "0.18cqw",
              background: "linear-gradient(90deg, transparent, #c9972b, transparent)",
            }}
          />
          <p style={{ marginTop: "1.4cqw", fontSize: "1.45cqw", color: "#5b5578", letterSpacing: "0.04em" }}>
            for successfully completing the course
          </p>
          <p
            className="mx-auto"
            style={{
              marginTop: "0.8cqw",
              maxWidth: "70cqw",
              fontFamily: SERIF,
              fontSize: `${titleSize}cqw`,
              fontWeight: 700,
              lineHeight: 1.2,
              color: INK,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {courseTitle}
          </p>
          <p
            className="uppercase"
            style={{
              marginTop: "1.3cqw",
              fontSize: "1.15cqw",
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: GOLD_TEXT,
            }}
          >
            Awarded on {issued}
          </p>
        </div>

        {/* footer */}
        <div className="w-full">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 9.6cqw 1fr",
              columnGap: "4cqw",
              alignItems: "end",
              padding: "0 3cqw",
            }}
          >
            <FooterField
              caption="Authorised by"
              overlay={
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: "9.6cqw",
                    left: "50%",
                    top: "-5.2cqw",
                    transform: "translateX(-50%)",
                    mixBlendMode: "multiply",
                  }}
                >
                  <Stamp dateText={stampDate} />
                </div>
              }
            />

            <Seal />

            <FooterField caption="Course instructor">
              <span
                className="truncate"
                style={{
                  fontFamily: SCRIPT,
                  fontSize: `${scriptSize(instructorName)}cqw`,
                  lineHeight: 1.2,
                  color: PURPLE_DARK,
                  maxWidth: "100%",
                }}
              >
                {instructorName}
              </span>
            </FooterField>
          </div>

          <p style={{ marginTop: "1.1cqw", fontSize: "1cqw", color: "#6b6584", letterSpacing: "0.06em" }}>
            Certificate ID:{" "}
            <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontWeight: 700, color: INK }}>
              {certificateId}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
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

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 print:min-h-0 print:bg-white print:p-0">
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

      <CertificateSheet
        studentName={cert.studentName || user?.name || "Student"}
        courseTitle={cert.courseTitle || "Course"}
        instructorName={cert.instructorName || "Instructor"}
        issuedAt={cert.issuedAt}
        certificateId={cert.certificateId}
      />
    </div>
  );
}