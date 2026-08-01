import React, { useState, useMemo, useRef } from "react";
import { Search, Plus, Minus, Check, Clock, User, LayoutGrid, ClipboardList, ChevronDown, ChevronUp, Flower2, Zap } from "lucide-react";
import { useOrdersData } from "./useOrdersData";

export default function App() {
  const [view, setView] = useState("rapido");
  const data = useOrdersData();

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
        {view === "empregado" && <EmployeeView data={data} />}
        {view === "rapido" && <FastEntryView data={data} />}
        {view === "pai" && <FatherView data={data} />}
      </div>

      <div style={tabBarStyle}>
        <div style={{ maxWidth: 460, margin: "0 auto", display: "flex" }}>
          <TabButton active={view === "rapido"} onClick={() => setView("rapido")} icon={<Zap size={20} />} label="Modo Rápido" />
          <TabButton active={view === "empregado"} onClick={() => setView("empregado")} icon={<ClipboardList size={20} />} label="Registar" />
          <TabButton active={view === "pai"} onClick={() => setView("pai")} icon={<LayoutGrid size={20} />} label="Apanhado" />
        </div>
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

function FastEntryView({ data }) {
  const { employees, flowers, detalhe, addOrder } = data;
  const ownerName = employees.find((e) => e.is_owner)?.name ?? "";
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [date, setDate] = useState(tomorrowStr);
  const [client, setClient] = useState("");
  const [flowerQuery, setFlowerQuery] = useState("");
  const [flowerOpen, setFlowerOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [qty, setQty] = useState(1);
  const [flashTotal, setFlashTotal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const clientRef = useRef(null);
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
    if (!client.trim() || !selectedFlower || qty <= 0 || submitting) return;
    setSubmitting(true);
    try {
      await addOrder({
        employeeName: ownerName,
        clientName: client,
        flowerName: selectedFlower,
        quantity: qty,
        deliveryDate: date,
      });
      setFlashTotal(selectedFlower);
      setTimeout(() => setFlashTotal(null), 900);
      setClient(""); setFlowerQuery(""); setSelectedFlower(null); setQty(1);
      setTimeout(() => clientRef.current?.focus(), 50);
    } catch (err) {
      alert("Erro ao guardar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClientKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); flowerRef.current?.focus(); }
  }
  function handleFlowerKeyDown(e) {
    if (e.key === "Enter" && matches.length > 0 && !selectedFlower) { e.preventDefault(); pickFlower(matches[0]); }
  }

  const canAdd = client.trim() && selectedFlower && qty > 0 && !submitting;

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={eyebrowStyle}>Modo Rápido — {ownerName}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A26", marginTop: 2 }}>Bater o papel</div>
        <div style={{ fontSize: 13, color: "#8A8377", marginTop: 4 }}>Vai preenchendo linha a linha. A soma à direita atualiza sozinha.</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[0, 1, 2].map((offset) => {
          const d = new Date(); d.setDate(d.getDate() + offset);
          const iso = d.toISOString().slice(0, 10);
          const label = offset === 0 ? "Hoje" : offset === 1 ? "Amanhã" : d.toLocaleDateString("pt-PT", { weekday: "short" });
          return <button key={iso} onClick={() => setDate(iso)} style={dateChipStyle(date === iso)}>{label}</button>;
        })}
      </div>

      <div style={liveBannerStyle}>
        <div>
          <div style={{ fontSize: 11, color: "#EAF0EA", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Total desta sessão</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{totalQty} <span style={{ fontSize: 14, fontWeight: 600 }}>molhos</span></div>
        </div>
        <div style={{ fontSize: 12, color: "#EAF0EA", textAlign: "right" }}>{sessionEntries.length} linha{sessionEntries.length !== 1 ? "s" : ""}<br />registadas</div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, border: "1px solid #EEEAE0", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1.1 }}>
            <label style={labelStyle}>Cliente</label>
            <input ref={clientRef} value={client} onChange={(e) => setClient(e.target.value)} onKeyDown={handleClientKeyDown} placeholder="Nome" style={inputStyleSm} autoFocus />
          </div>
          <div style={{ flex: 1.4, position: "relative" }}>
            <label style={labelStyle}>Flor</label>
            <input
              ref={flowerRef}
              value={flowerQuery}
              onChange={(e) => { setFlowerQuery(e.target.value); setSelectedFlower(null); setFlowerOpen(true); }}
              onFocus={() => setFlowerOpen(true)}
              onKeyDown={handleFlowerKeyDown}
              placeholder="Procurar..."
              style={{ ...inputStyleSm, border: selectedFlower ? "2px solid #4A6B4D" : "1.5px solid #E3DFD5" }}
            />
            {flowerOpen && flowerQuery && matches.length > 0 && (
              <div style={dropdownStyle}>
                {matches.map((f) => <div key={f.id} onClick={() => pickFlower(f)} style={dropdownItemStyle}>{highlightMatch(f.name, flowerQuery)}</div>)}
              </div>
            )}
          </div>
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
          <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Soma ao vivo — {date === tomorrowStr ? "amanhã" : date === todayStr ? "hoje" : date}</div>
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
    </div>
  );
}

/* ============================================================
   EMPREGADO
   ============================================================ */

function EmployeeView({ data }) {
  const { employees, flowers, detalhe, addOrder } = data;
  const [employee, setEmployee] = useState(null);
  const [client, setClient] = useState("");
  const [flowerQuery, setFlowerQuery] = useState("");
  const [flowerOpen, setFlowerOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const matches = useMemo(() => {
    if (!flowerQuery.trim()) return [];
    const q = flowerQuery.toLowerCase();
    return flowers.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
  }, [flowerQuery, flowers]);

  const canSubmit = employee && client.trim() && selectedFlower && qty > 0 && date && !submitting;

  function pickFlower(f) { setSelectedFlower(f.name); setFlowerQuery(f.name); setFlowerOpen(false); }

  async function submitEntry() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addOrder({ employeeName: employee, clientName: client, flowerName: selectedFlower, quantity: qty, deliveryDate: date });
      setClient(""); setFlowerQuery(""); setSelectedFlower(null); setQty(1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    } catch (err) {
      alert("Erro ao guardar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const mine = employee ? detalhe.filter((e) => e.employee_name === employee) : detalhe;

  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={eyebrowStyle}>Apanhado de Encomendas</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A26", marginTop: 2 }}>
          {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Quem és tu?</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {employees.filter((e) => !e.is_owner).map((e) => (
            <button key={e.id} onClick={() => setEmployee(e.name)} style={pillStyle(employee === e.name)}>{e.name}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #EEEAE0" }}>
        <label style={labelStyle}>Cliente</label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <User size={18} style={{ position: "absolute", left: 12, top: 14, color: "#8A8377" }} />
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" style={{ ...inputStyle, paddingLeft: 40 }} />
        </div>

        <label style={labelStyle}>Flor</label>
        <div style={{ position: "relative", marginBottom: 4 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: 14, color: "#8A8377" }} />
          <input
            value={flowerQuery}
            onChange={(e) => { setFlowerQuery(e.target.value); setSelectedFlower(null); setFlowerOpen(true); }}
            onFocus={() => setFlowerOpen(true)}
            placeholder="Escreve para procurar..."
            style={{ ...inputStyle, paddingLeft: 40, border: selectedFlower ? "2px solid #4A6B4D" : "1.5px solid #E3DFD5" }}
          />
          {selectedFlower && <Check size={18} style={{ position: "absolute", right: 12, top: 14, color: "#4A6B4D" }} />}
          {flowerOpen && flowerQuery && matches.length > 0 && (
            <div style={dropdownStyle}>
              {matches.map((f) => <div key={f.id} onClick={() => pickFlower(f)} style={dropdownItemStyle}>{highlightMatch(f.name, flowerQuery)}</div>)}
            </div>
          )}
        </div>
        <div style={{ height: 12 }} />

        <label style={labelStyle}>Quantidade (molhos)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={stepperBtnStyle}><Minus size={20} /></button>
          <div style={{ fontSize: 26, fontWeight: 700, minWidth: 40, textAlign: "center", color: "#2B2A26" }}>{qty}</div>
          <button onClick={() => setQty((q) => q + 1)} style={stepperBtnStyle}><Plus size={20} /></button>
        </div>

        <label style={labelStyle}>Data de entrega</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[0, 1, 2].map((offset) => {
            const d = new Date(); d.setDate(d.getDate() + offset);
            const iso = d.toISOString().slice(0, 10);
            const label = offset === 0 ? "Hoje" : offset === 1 ? "Amanhã" : d.toLocaleDateString("pt-PT", { weekday: "short" });
            return <button key={iso} onClick={() => setDate(iso)} style={dateChipStyle(date === iso)}>{label}</button>;
          })}
        </div>

        <button onClick={submitEntry} disabled={!canSubmit} style={{
          width: "100%", padding: "16px 0", borderRadius: 12, border: "none",
          background: canSubmit ? "#4A6B4D" : "#DDD9CE", color: "#FFFFFF", fontWeight: 700, fontSize: 16,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}>
          {submitting ? "A guardar..." : justAdded ? "Adicionado ✓" : "Adicionar Encomenda"}
        </button>
      </div>

      {mine.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...eyebrowStyle, marginBottom: 10 }}>{employee ? `Registadas por ti (${mine.length})` : `Todas as encomendas (${mine.length})`}</div>
          {mine.slice(0, 8).map((e) => (
            <div key={e.id} style={entryRowStyle}>
              <div>
                <div style={{ fontWeight: 600, color: "#2B2A26", fontSize: 14 }}>{e.flower_name} × {e.quantity}</div>
                <div style={{ fontSize: 12, color: "#8A8377", marginTop: 2 }}>{e.client_name} · {e.employee_name} · entrega {e.delivery_date === todayStr ? "hoje" : e.delivery_date}</div>
              </div>
              <Clock size={16} color="#C4BFB2" />
            </div>
          ))}
        </div>
      )}
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

  function dateLabel(iso) {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (iso === today) return "Hoje";
    if (iso === tomorrow) return "Amanhã";
    return new Date(iso).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  }

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
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2B2A26", textTransform: "capitalize" }}>Entrega — {dateLabel(date)}</div>
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

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<strong style={{ color: "#4A6B4D" }}>{text.slice(idx, idx + query.length)}</strong>{text.slice(idx + query.length)}</>;
}

function pillStyle(active) {
  return { padding: "10px 18px", borderRadius: 999, border: active ? "2px solid #4A6B4D" : "2px solid #E3DFD5", background: active ? "#4A6B4D" : "#FFFFFF", color: active ? "#FFFFFF" : "#2B2A26", fontWeight: 600, fontSize: 15, cursor: "pointer" };
}
function dateChipStyle(active) {
  return { flex: 1, padding: "10px 0", borderRadius: 10, border: active ? "2px solid #4A6B4D" : "1.5px solid #E3DFD5", background: active ? "#EAF0EA" : "#FFFFFF", color: "#2B2A26", fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" };
}

const eyebrowStyle = { fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A8377", fontWeight: 600 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#8A8377", marginBottom: 6, marginTop: 2 };
const inputStyle = { width: "100%", padding: "13px 12px", borderRadius: 10, border: "1.5px solid #E3DFD5", fontSize: 16, outline: "none", boxSizing: "border-box", color: "#2B2A26", background: "#FCFBF9" };
const inputStyleSm = { width: "100%", padding: "10px 10px", borderRadius: 9, border: "1.5px solid #E3DFD5", fontSize: 14.5, outline: "none", boxSizing: "border-box", color: "#2B2A26", background: "#FCFBF9" };
const dropdownStyle = { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#FFFFFF", border: "1.5px solid #E3DFD5", borderRadius: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" };
const dropdownItemStyle = { padding: "12px 14px", fontSize: 15, color: "#2B2A26", cursor: "pointer", borderBottom: "1px solid #F2EFE8" };
const stepperBtnStyle = { width: 44, height: 44, borderRadius: 10, border: "1.5px solid #E3DFD5", background: "#FCFBF9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2B2A26" };
const stepperBtnStyleSm = { width: 34, height: 34, borderRadius: 8, border: "1.5px solid #E3DFD5", background: "#FCFBF9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2B2A26" };
const entryRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FFFFFF", borderRadius: 10, border: "1px solid #EEEAE0", marginBottom: 8 };
const tabBarStyle = { position: "fixed", bottom: 0, left: 0, right: 0, background: "#FFFFFF", borderTop: "1px solid #EEEAE0", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)" };
const summaryCardStyle = { flex: 1, background: "#FFFFFF", border: "1px solid #EEEAE0", borderRadius: 12, padding: "12px 8px", textAlign: "center" };
const summaryNumStyle = { fontSize: 20, fontWeight: 700, color: "#4A6B4D" };
const summaryLabelStyle = { fontSize: 10.5, color: "#8A8377", marginTop: 2, fontWeight: 600 };
const liveBannerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(135deg, #4A6B4D, #3A5540)", borderRadius: 16, padding: "16px 18px", marginBottom: 16 };
