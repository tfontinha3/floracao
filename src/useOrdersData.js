import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

// Centraliza todo o acesso a dados. A UI não fala com o Supabase
// diretamente — fala com este hook.
export function useOrdersData() {
  const [employees, setEmployees] = useState([])
  const [flowers, setFlowers] = useState([])
  const [recentOrders, setRecentOrders] = useState([]) // últimas N, para as listas "registadas hoje"
  const [apanhado, setApanhado] = useState([])          // view apanhado_diario
  const [detalhe, setDetalhe] = useState([])             // view apanhado_detalhe
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadReferenceData = useCallback(async () => {
    const [{ data: emp, error: e1 }, { data: fl, error: e2 }] = await Promise.all([
      supabase.from('employees').select('id, name, is_owner').eq('active', true).order('is_owner', { ascending: false }),
      supabase.from('flowers').select('id, name, unit').eq('active', true).order('name'),
    ])
    if (e1 || e2) { setError(e1 || e2); return }
    setEmployees(emp)
    setFlowers(fl)
  }, [])

  const loadAggregates = useCallback(async () => {
    const [{ data: ap, error: e1 }, { data: det, error: e2 }] = await Promise.all([
      supabase.from('apanhado_diario').select('*'),
      supabase.from('apanhado_detalhe').select('*').limit(500),
    ])
    if (e1 || e2) { setError(e1 || e2); return }
    setApanhado(ap)
    setDetalhe(det)
    setRecentOrders(det.slice(0, 20))
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadReferenceData(), loadAggregates()])
    setLoading(false)
  }, [loadReferenceData, loadAggregates])

  useEffect(() => {
    refreshAll()

    // Atualiza sozinho quando qualquer dispositivo insere uma encomenda nova
    // (assim o pai vê o total subir mesmo que sejas tu, remoto, a testar)
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadAggregates()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [refreshAll, loadAggregates])

  // Vai buscar (ou cria) o id do cliente pelo nome — o campo "Cliente" continua
  // a ser texto livre na UI, mas fica normalizado na base de dados.
  async function getOrCreateClientId(name) {
    const trimmed = name.trim()
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', trimmed)
      .maybeSingle()
    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('clients')
      .insert({ name: trimmed })
      .select('id')
      .single()
    if (error) throw error
    return created.id
  }

  async function addOrder({ employeeName, clientName, flowerName, quantity, deliveryDate }) {
    const employee = employees.find((e) => e.name === employeeName)
    const flower = flowers.find((f) => f.name === flowerName)
    if (!employee || !flower) throw new Error('Empregado ou flor inválidos')

    const clientId = await getOrCreateClientId(clientName)

    const { error } = await supabase.from('orders').insert({
      employee_id: employee.id,
      client_id: clientId,
      flower_id: flower.id,
      quantity,
      delivery_date: deliveryDate,
    })
    if (error) throw error

    // atualização otimista: refaz os agregados já (o realtime também trata disto,
    // mas isto garante feedback instantâneo em quem acabou de inserir)
    await loadAggregates()
  }

  return {
    employees,
    flowers,
    recentOrders,
    apanhado,
    detalhe,
    loading,
    error,
    addOrder,
    refreshAll,
  }
}
