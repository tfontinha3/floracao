import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Minus, LayoutGrid, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Flower2, Zap, Lock } from "lucide-react";
import { useOrdersData } from "./useOrdersData";

const PIN_STORAGE_KEY = "floracao_unlocked";

export default function App() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(PIN_STORAGE_KEY) === "true");
  const [view, setView] = useState("rapido");
  const data = useOrdersData();

  // Se a app ficar aberta de um dia para o outro (ex.: telemóvel do Heitor a noite toda),
  // isto força um re-render quando a data muda, para "Hoje"/"Amanhã" e a janela de entrega
  // se atualizarem sozinhos sem precisar de recarregar a página.
  const [, setDayTick] = useState(0);
  useEffect(() => {
    let lastDay = new Date().toISOString().slice(0, 10);
    const id = setInterval(() => {
      const day = new Date().toISOString().slice(0, 10);
      if (day !== lastDay) {
        lastDay = day;
        setDayTick((t) => t + 1);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!unlocked) {
    return <PinGate onUnlock={() => { localStorage.setItem(PIN_STORAGE_KEY, "true"); setUnlocked(true); }} />;
  }

  if (data.loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#8A8377" }}>A carregar...</div>;
  }
  if (data.error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#B14A4A" }}>
        Erro a ligar à base de dados: {String(data.error.message || data.error)}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F7F5F1", minHeight: "100vh" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", paddingBottom: 90 }}>
        {view === "flores" && <FlowerCatalogView data={data} />}
        {view === "rapido" && <FastEntryView data={data} />}
        {view === "pai" && <FatherView data={data} />}
      </div>

      <div style={tabBarStyle}>
        <div style={{ maxWidth: 460, margin: "0 auto", display: "flex" }}>
          <TabButton active={view === "rapido"} onClick={() => setView("rapido")} icon={<Zap size={20} />} label="Modo Rápido" />
          <TabButton active={view === "flores"} onClick={() => setView("flores")} icon={<Flower2 size={20} />} label="Flores" />
          <TabButton active={view === "pai"} onClick={() => setView("pai")} icon={<LayoutGrid size={20} />} label="Apanhado" />
        </div>
      </div>
    </div>
  );
}

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit() {
    if (pin === import.meta.env.VITE_APP_PIN) {
      onUnlock();
    } else {
      setWrong(true);
      setPin("");
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif", background: "#F7F5F1", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, border: "1px solid #EEEAE0", maxWidth: 320, width: "100%", textAlign: "center" }}>
        <Lock size={28} color="#4A6B4D" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2B2A26", marginBottom: 4 }}>Floração</div>
        <div style={{ fontSize: 13, color: "#8A8377", marginBottom: 16 }}>Código de acesso</div>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setWrong(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="••••••"
          autoFocus
          style={{ width: "100%", padding: "13px 12px", borderRadius: 10, border: wrong ? "2px solid #B14A4A" : "1.5px solid #E3DFD5", fontSize: 20, textAlign: "center", letterSpacing: 4, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
        />
        {wrong && <div style={{ color: "#B14A4A", fontSize: 13, marginBottom: 10 }}>Código errado, tenta outra vez.</div>}
        <button onClick={submit} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: "#4A6B4D", color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "12px 0 10px", border: "none", background: "transparent",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      cursor: "pointer", color: active ? "#4A6B4D" : "#B0AB9E",
    }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
    </button>
  );
}

/* ============================================================
   MODO RÁPIDO — ecrã do pai
   ============================================================ */

const QUICK_ENTRY_CLIENT = "Sem cliente";

function FastEntryView({ data }) {
  const { employees, flowers, detalhe, addOrder } = data;
  const ownerName = employees.find((e) => e.is_owner)?.name ?? "";
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [date, setDate] = useState(tomorrowStr);
  const [flowerQuery, setFlowerQuery] = useState("");
  const [flowerOpen, setFlowerOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [qty, setQty] = useState(1);
  const [flashTotal, setFlashTotal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const flowerRef = useRef(null);

  const matches = useMemo(() => {
    if (!flowerQuery.trim()) return [];
    const q = flowerQuery.toLowerCase();
    return flowers.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
  }, [flowerQuery, flowers]);

  // Sessão: entradas do dono para a data escolhida, vindas do detalhe já carregado
  const sessionEntries = useMemo(
    () => detalhe.filter((e) => e.employee_name === ownerName && e.delivery_date === date),
    [detalhe, date, ownerName]
  );

  const liveTotals = useMemo(() => {
    const totals = {};
    for (const e of sessionEntries) totals[e.flower_name] = (totals[e.flower_name] || 0) + Number(e.quantity);
    return Object.entries(totals).sort(([, a], [, b]) => b - a);
  }, [sessionEntries]);

  const totalQty = sessionEntries.reduce((s, e) => s + Number(e.quantity), 0);

  function pickFlower(f) {
    setSelectedFlower(f.name);
    setFlowerQuery(f.name);
    setFlowerOpen(false);
  }

  async function addLine() {
    if (!selectedFlower || qty <= 0 || submitting) return;
    setSubmitting(true);
    try {
      await addOrder({
        employeeName: ownerName,
        clientName: QUICK_ENTRY_CLIENT,
        flowerName: selectedFlower,
        quantity: qty,
        deliveryDate: date,
      });
      setFlashTotal(selectedFlower);
      setTimeout(() => setFlashTotal(null), 900);
      setFlowerQuery(""); setSelectedFlower(null); setQty(1);
      setTimeout(() => flowerRef.current?.focus(), 50);
    } catch (err) {
      alert("Erro ao guardar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFlowerKeyDown(e) {
    if (e.key === "Enter" && matches.length > 0 && !selectedFlower) { e.preventDefault(); pickFlower(matches[0]); }
  }

  const canAdd = selectedFlower && qty > 0 && !submitting;

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={eyebrowStyle}>Modo Rápido — {ownerName}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A26", marginTop: 2 }}>Bater o papel</div>
        <div style={{ fontSize: 13, color: "#8A8377", marginTop: 4 }}>
          A registar para <strong style={{ color: "#4A6B4D" }}>{formatDateLabel(date).toLowerCase()}</strong> — escolhe outro dia no calendário em baixo.
        </div>
      </div>

      <div style={liveBannerStyle}>
        <div>
          <div style={{ fontSize: 11, color: "#EAF0EA", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Total desta sessão</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{totalQty} <span style={{ fontSize: 14, fontWeight: 600 }}>molhos</span></div>
        </div>
        <div style={{ fontSize: 12, color: "#EAF0EA", textAlign: "right" }}>{sessionEntries.length} linha{sessionEntries.length !== 1 ? "s" : ""}<br />registadas</div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, border: "1px solid #EEEAE0", marginBottom: 18 }}>
        <div style={{ marginBottom: 10, position: "relative" }}>
          <label style={labelStyle}>Flor</label>
          <input
            ref={flowerRef}
            value={flowerQuery}
            onChange={(e) => { setFlowerQuery(e.target.value); setSelectedFlower(null); setFlowerOpen(true); }}
            onFocus={() => setFlowerOpen(true)}
            onKeyDown={handleFlowerKeyDown}
            placeholder="Procurar..."
            style={{ ...inputStyleSm, border: selectedFlower ? "2px solid #4A6B4D" : "1.5px solid #E3DFD5" }}
            autoFocus
          />
          {flowerOpen && flowerQuery && matches.length > 0 && (
            <div style={dropdownStyle}>
              {matches.map((f) => (
                <div key={f.id} onClick={() => pickFlower(f)} style={dropdownItemStyle}>
                  <div>{highlightMatch(f.name, flowerQuery)}</div>
                  {f.family && <div style={dropdownItemFamilyStyle}>{f.family}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: "space-between" }}>
          <div>
            <label style={labelStyle}>Qtd.</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={stepperBtnStyleSm}><Minus size={16} /></button>
              <div style={{ fontSize: 19, fontWeight: 700, minWidth: 26, textAlign: "center" }}>{qty}</div>
              <button onClick={() => setQty((q) => q + 1)} style={stepperBtnStyleSm}><Plus size={16} /></button>
            </div>
          </div>
          <button onClick={addLine} disabled={!canAdd} style={{
            flex: 1, padding: "13px 0", borderRadius: 10, border: "none",
            background: canAdd ? "#4A6B4D" : "#DDD9CE", color: "#FFFFFF", fontWeight: 700, fontSize: 15,
            cursor: canAdd ? "pointer" : "not-allowed",
          }}>
            {submitting ? "A guardar..." : "+ Linha seguinte"}
          </button>
        </div>
      </div>

      {liveTotals.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Soma ao vivo — {formatDateLabel(date).toLowerCase()}</div>
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EEEAE0", overflow: "hidden" }}>
            {liveTotals.map(([flower, qty], i) => (
              <div key={flower} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px",
                borderTop: i > 0 ? "1px solid #F2EFE8" : "none",
                background: flashTotal === flower ? "#EAF0EA" : "transparent", transition: "background 0.6s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Flower2 size={15} color="#4A6B4D" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#2B2A26" }}>{flower}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#4A6B4D" }}>{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessionEntries.length === 0 && (
        <div style={{ textAlign: "center", color: "#B0AB9E", padding: "24px 0", fontSize: 13 }}>Ainda sem linhas nesta sessão. Começa a bater o papel ↑</div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Data de entrega</div>
        <DeliveryCalendar selected={date} onSelect={setDate} />
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function buildCalendarWeeks(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = segunda

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, iso: d.toISOString().slice(0, 10) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function DeliveryCalendar({ selected, onSelect }) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });

  const monthLabel = viewDate.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const weeks = useMemo(() => buildCalendarWeeks(viewDate), [viewDate]);
  const isCurrentMonth = viewDate.toISOString().slice(0, 7) === todayIso.slice(0, 7);

  function goPrevMonth() {
    if (isCurrentMonth) return;
    setViewDate((d) => { const nd = new Date(d); nd.setMonth(nd.getMonth() - 1); return nd; });
  }
  function goNextMonth() {
    setViewDate((d) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + 1); return nd; });
  }

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, border: "1px solid #EEEAE0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={goPrevMonth} disabled={isCurrentMonth} style={calendarNavBtnStyle(isCurrentMonth)}><ChevronLeft size={18} /></button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2A26", textTransform: "capitalize" }}>{monthLabel}</div>
        <button onClick={goNextMonth} style={calendarNavBtnStyle(false)}><ChevronRight size={18} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#B0AB9E", padding: "4px 0" }}>{w}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} />;
            const isPast = day.iso < todayIso;
            const isSelected = day.iso === selected;
            const isToday = day.iso === todayIso;
            return (
              <button key={di} disabled={isPast} onClick={() => onSelect(day.iso)} style={calendarDayStyle({ isSelected, isToday, isPast })}>
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   CATÁLOGO DE FLORES (só consulta)
   ============================================================ */

function FlowerCatalogView({ data }) {
  const { flowers } = data;

  const grouped = useMemo(() => {
    const byFamily = {};
    for (const f of flowers) {
      const family = f.family || "Outras";
      (byFamily[family] ||= []).push(f);
    }
    return Object.entries(byFamily)
      .sort(([a], [b]) => a.localeCompare(b, "pt"))
      .map(([family, items]) => ({ family, items: items.slice().sort((a, b) => a.name.localeCompare(b.name, "pt")) }));
  }, [flowers]);

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={eyebrowStyle}>Catálogo</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A26", marginTop: 2 }}>Flores no Sistema</div>
        <div style={{ fontSize: 13, color: "#8A8377", marginTop: 4 }}>Só para consulta — para registar encomendas usa o Modo Rápido.</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={summaryCardStyle}><div style={summaryNumStyle}>{flowers.length}</div><div style={summaryLabelStyle}>flores</div></div>
        <div style={summaryCardStyle}><div style={summaryNumStyle}>{grouped.length}</div><div style={summaryLabelStyle}>famílias</div></div>
      </div>

      {grouped.map(({ family, items }) => (
        <div key={family} style={{ marginBottom: 20 }}>
          <div style={{ ...eyebrowStyle, marginBottom: 8 }}>{family} ({items.length})</div>
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EEEAE0", overflow: "hidden" }}>
            {items.map((f, i) => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                borderTop: i > 0 ? "1px solid #F2EFE8" : "none",
              }}>
                <Flower2 size={15} color="#4A6B4D" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2B2A26" }}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   VISTA DO PAI (agregado)
   ============================================================ */

function FatherView({ data }) {
  const { apanhado, detalhe } = data;
  const [expandedKey, setExpandedKey] = useState(null);

  const grouped = useMemo(() => {
    const byDate = {};
    for (const row of apanhado) {
      if (!byDate[row.delivery_date]) byDate[row.delivery_date] = [];
      byDate[row.delivery_date].push(row);
    }
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, flowers]) => ({
      date, flowers: flowers.sort((a, b) => b.total_quantity - a.total_quantity),
    }));
  }, [apanhado]);

  const totalOrders = detalhe.length;
  const totalQty = apanhado.reduce((s, r) => s + Number(r.total_quantity), 0);

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={eyebrowStyle}>Vista do Chefe</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A26", marginTop: 2 }}>Apanhado Automático</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={summaryCardStyle}><div style={summaryNumStyle}>{totalOrders}</div><div style={summaryLabelStyle}>encomendas</div></div>
        <div style={summaryCardStyle}><div style={summaryNumStyle}>{totalQty}</div><div style={summaryLabelStyle}>molhos no total</div></div>
        <div style={summaryCardStyle}><div style={summaryNumStyle}>{grouped.length}</div><div style={summaryLabelStyle}>dias com entregas</div></div>
      </div>

      {grouped.length === 0 && <div style={{ textAlign: "center", color: "#8A8377", padding: "40px 0", fontSize: 14 }}>Ainda sem encomendas registadas.</div>}

      {grouped.map(({ date, flowers }) => {
        const dayTotal = flowers.reduce((s, f) => s + Number(f.total_quantity), 0);
        return (
          <div key={date} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2B2A26", textTransform: "capitalize" }}>Entrega — {formatDateLabel(date)}</div>
              <div style={{ fontSize: 12, color: "#8A8377", fontWeight: 600 }}>{dayTotal} molhos</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EEEAE0", overflow: "hidden" }}>
              {flowers.map((f, i) => {
                const key = `${date}-${f.flower_id}`;
                const isOpen = expandedKey === key;
                const items = detalhe.filter((d) => d.delivery_date === date && d.flower_id === f.flower_id);
                return (
                  <div key={key} style={{ borderTop: i > 0 ? "1px solid #F2EFE8" : "none" }}>
                    <button onClick={() => setExpandedKey(isOpen ? null : key)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Flower2 size={16} color="#4A6B4D" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#2B2A26" }}>{f.flower_name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#4A6B4D" }}>{f.total_quantity}</span>
                        {isOpen ? <ChevronUp size={16} color="#B0AB9E" /> : <ChevronDown size={16} color="#B0AB9E" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 14px 12px 40px" }}>
                        {items.map((it) => (
                          <div key={it.id} style={{ fontSize: 12.5, color: "#8A8377", padding: "4px 0" }}>
                            {it.quantity} × {it.client_name} <span style={{ color: "#C4BFB2" }}>· registado por {it.employee_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- SHARED ---------------- */

// Datas possíveis para entrega: hoje até ao fim da semana seguinte (a janela desliza
// sozinha à medida que os dias passam — nunca é preciso tocar nisto).
function formatDateLabel(iso) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Hoje";
  if (iso === tomorrow) return "Amanhã";
  return new Date(iso).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<strong style={{ color: "#4A6B4D" }}>{text.slice(idx, idx + query.length)}</strong>{text.slice(idx + query.length)}</>;
}

function calendarNavBtnStyle(disabled) {
  return { width: 30, height: 30, borderRadius: 8, border: "1.5px solid #E3DFD5", background: disabled ? "#F7F5F1" : "#FCFBF9", display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", color: disabled ? "#DDD9CE" : "#2B2A26" };
}
function calendarDayStyle({ isSelected, isToday, isPast }) {
  return {
    aspectRatio: "1", border: isToday && !isSelected ? "1.5px solid #4A6B4D" : "1.5px solid transparent",
    borderRadius: 8, background: isSelected ? "#4A6B4D" : "transparent",
    color: isPast ? "#DDD9CE" : isSelected ? "#FFFFFF" : "#2B2A26",
    fontSize: 13, fontWeight: isSelected || isToday ? 700 : 500,
    cursor: isPast ? "default" : "pointer",
  };
}

const eyebrowStyle = { fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A8377", fontWeight: 600 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#8A8377", marginBottom: 6, marginTop: 2 };
const inputStyleSm = { width: "100%", padding: "10px 10px", borderRadius: 9, border: "1.5px solid #E3DFD5", fontSize: 14.5, outline: "none", boxSizing: "border-box", color: "#2B2A26", background: "#FCFBF9" };
const dropdownStyle = { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#FFFFFF", border: "1.5px solid #E3DFD5", borderRadius: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" };
const dropdownItemStyle = { padding: "12px 14px", fontSize: 15, color: "#2B2A26", cursor: "pointer", borderBottom: "1px solid #F2EFE8" };
const dropdownItemFamilyStyle = { fontSize: 11.5, color: "#B0AB9E", marginTop: 1 };
const stepperBtnStyleSm = { width: 34, height: 34, borderRadius: 8, border: "1.5px solid #E3DFD5", background: "#FCFBF9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2B2A26" };
const tabBarStyle = { position: "fixed", bottom: 0, left: 0, right: 0, background: "#FFFFFF", borderTop: "1px solid #EEEAE0", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)" };
const summaryCardStyle = { flex: 1, background: "#FFFFFF", border: "1px solid #EEEAE0", borderRadius: 12, padding: "12px 8px", textAlign: "center" };
const summaryNumStyle = { fontSize: 20, fontWeight: 700, color: "#4A6B4D" };
const summaryLabelStyle = { fontSize: 10.5, color: "#8A8377", marginTop: 2, fontWeight: 600 };
const liveBannerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(135deg, #4A6B4D, #3A5540)", borderRadius: 16, padding: "16px 18px", marginBottom: 16 };
