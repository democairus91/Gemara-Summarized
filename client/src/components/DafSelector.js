import React from "react";

const TRACTATES = [
  // Zeraim
  { name: "Berakhot", he: "ברכות", lastDaf: 64, seder: "זרעים" },
  // Moed
  { name: "Shabbat", he: "שבת", lastDaf: 157, seder: "מועד" },
  { name: "Eruvin", he: "עירובין", lastDaf: 105, seder: "מועד" },
  { name: "Pesachim", he: "פסחים", lastDaf: 121, seder: "מועד" },
  { name: "Yoma", he: "יומא", lastDaf: 88, seder: "מועד" },
  { name: "Sukkah", he: "סוכה", lastDaf: 56, seder: "מועד" },
  { name: "Beitzah", he: "ביצה", lastDaf: 40, seder: "מועד" },
  { name: "Rosh Hashanah", he: "ראש השנה", lastDaf: 35, seder: "מועד" },
  { name: "Taanit", he: "תענית", lastDaf: 31, seder: "מועד" },
  { name: "Megillah", he: "מגילה", lastDaf: 32, seder: "מועד" },
  { name: "Moed Katan", he: "מועד קטן", lastDaf: 29, seder: "מועד" },
  { name: "Chagigah", he: "חגיגה", lastDaf: 27, seder: "מועד" },
  // Nashim
  { name: "Yevamot", he: "יבמות", lastDaf: 122, seder: "נשים" },
  { name: "Ketubot", he: "כתובות", lastDaf: 112, seder: "נשים" },
  { name: "Nedarim", he: "נדרים", lastDaf: 91, seder: "נשים" },
  { name: "Nazir", he: "נזיר", lastDaf: 66, seder: "נשים" },
  { name: "Sotah", he: "סוטה", lastDaf: 49, seder: "נשים" },
  { name: "Gittin", he: "גיטין", lastDaf: 90, seder: "נשים" },
  { name: "Kiddushin", he: "קידושין", lastDaf: 82, seder: "נשים" },
  // Nezikin
  { name: "Bava Kamma", he: "בבא קמא", lastDaf: 119, seder: "נזיקין" },
  { name: "Bava Metzia", he: "בבא מציעא", lastDaf: 119, seder: "נזיקין" },
  { name: "Bava Batra", he: "בבא בתרא", lastDaf: 176, seder: "נזיקין" },
  { name: "Sanhedrin", he: "סנהדרין", lastDaf: 113, seder: "נזיקין" },
  { name: "Makkot", he: "מכות", lastDaf: 24, seder: "נזיקין" },
  { name: "Shevuot", he: "שבועות", lastDaf: 49, seder: "נזיקין" },
  { name: "Avodah Zarah", he: "עבודה זרה", lastDaf: 76, seder: "נזיקין" },
  { name: "Horayot", he: "הוריות", lastDaf: 14, seder: "נזיקין" },
  // Kodashim
  { name: "Zevachim", he: "זבחים", lastDaf: 120, seder: "קדשים" },
  { name: "Menachot", he: "מנחות", lastDaf: 110, seder: "קדשים" },
  { name: "Chullin", he: "חולין", lastDaf: 142, seder: "קדשים" },
  { name: "Bekhorot", he: "בכורות", lastDaf: 61, seder: "קדשים" },
  { name: "Arakhin", he: "ערכין", lastDaf: 34, seder: "קדשים" },
  { name: "Temurah", he: "תמורה", lastDaf: 34, seder: "קדשים" },
  { name: "Keritot", he: "כריתות", lastDaf: 28, seder: "קדשים" },
  { name: "Meilah", he: "מעילה", lastDaf: 22, seder: "קדשים" },
  { name: "Tamid", he: "תמיד", lastDaf: 33, seder: "קדשים" },
  // Tahorot
  { name: "Niddah", he: "נדה", lastDaf: 73, seder: "טהרות" },
];

// Group by seder for the dropdown
const SEDARIM_ORDER = ["זרעים", "מועד", "נשים", "נזיקין", "קדשים", "טהרות"];
const grouped = SEDARIM_ORDER.map((seder) => ({
  seder,
  tractates: TRACTATES.filter((t) => t.seder === seder),
}));

export default function DafSelector({
  tractate,
  dafNumber,
  amud,
  showEnglish,
  onTractateChange,
  onDafNumberChange,
  onAmudChange,
  onNavigate,
  onToggleEnglish,
  onPrev,
  onNext,
}) {
  const current = TRACTATES.find((t) => t.name === tractate);
  const maxDaf = current?.lastDaf || 100;

  return (
    <div className="daf-selector">
      {/* Prev */}
      <button
        className="btn btn-outline"
        onClick={onPrev}
        disabled={!onPrev}
        title="Previous Amud"
      >
        ◄
      </button>

      {/* Tractate */}
      <label>מסכת</label>
      <select
        value={tractate}
        onChange={(e) => onTractateChange(e.target.value)}
      >
        {grouped.map(({ seder, tractates }) => (
          <optgroup key={seder} label={`סדר ${seder}`}>
            {tractates.map((t) => (
              <option key={t.name} value={t.name}>
                {t.he} / {t.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Daf */}
      <label>דף</label>
      <input
        type="number"
        min={2}
        max={maxDaf}
        value={dafNumber}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onDafNumberChange(v);
        }}
      />

      {/* Amud */}
      <div className="amud-toggle">
        <button
          className={amud === "a" ? "active" : ""}
          onClick={() => onAmudChange("a")}
        >
          .
        </button>
        <button
          className={amud === "b" ? "active" : ""}
          onClick={() => onAmudChange("b")}
        >
          :
        </button>
      </div>

      {/* Go */}
      <button className="btn btn-primary" onClick={onNavigate}>
        לך
      </button>

      {/* Next */}
      <button
        className="btn btn-outline"
        onClick={onNext}
        disabled={!onNext}
        title="Next Amud"
      >
        ►
      </button>

      <div className="selector-spacer" />

      {/* Toggle English */}
      <button
        className={`btn toggle-english ${showEnglish ? "btn-primary" : "btn-outline"}`}
        onClick={onToggleEnglish}
      >
        {showEnglish ? "Hide English" : "Show English"}
      </button>
    </div>
  );
}
