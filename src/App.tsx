import React, { useState, useMemo } from 'react';
import { Calculator, Info, Trash2, Printer, Building2, Trees, LayoutGrid, Clock, AlertTriangle, X, Plus, ChevronDown, ChevronUp, Stethoscope, Settings, ExternalLink, Sparkles } from 'lucide-react';

const AppLogo = ({ className = "w-10 h-10", iconSize = "w-6 h-6", badgeSize = "w-4 h-4" }: { className?: string, iconSize?: string, badgeSize?: string }) => (
  <div className={`relative flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-md text-white shrink-0 ${className}`}>
    <Calculator className={iconSize} />
    <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-full shadow-sm text-teal-500 border border-slate-100">
      <Sparkles className={badgeSize} />
    </div>
  </div>
);

const FREQUENCIES = [
  { label: 'Padrão (100%)', value: 1 },
  { label: '4x semana (80%)', value: 0.8 },
  { label: '3x semana (60%)', value: 0.6 },
  { label: '2x semana (40%)', value: 0.4 },
  { label: '1x semana (20%)', value: 0.2 },
  { label: 'Quinzenal (10%)', value: 0.1 },
];

// Dados baseados na Instrução Normativa nº 5/2017 (Anexo VI-B) e atualizações
const CATEGORIES = [
  {
    id: 'internas',
    title: 'Áreas Internas',
    icon: <Building2 className="w-5 h-5" />,
    items: [
      { id: 'pisos_frios', name: 'Pisos Frios', index: 800, minIndex: 800, maxIndex: 1200, unit: 'm²' },
      { id: 'pisos_acarpetados', name: 'Pisos Acarpetados', index: 800, minIndex: 800, maxIndex: 1200, unit: 'm²' },
      { id: 'laboratorios', name: 'Laboratórios', index: 360, minIndex: 360, maxIndex: 450, unit: 'm²' },
      { id: 'almoxarifados', name: 'Almoxarifados / Galpões', index: 1500, minIndex: 1500, maxIndex: 2500, unit: 'm²' },
      { id: 'oficinas', name: 'Oficinas', index: 1200, minIndex: 1200, maxIndex: 1800, unit: 'm²' },
      { id: 'areas_livres', name: 'Saguão, Hall e Salão', index: 1000, minIndex: 1000, maxIndex: 1500, unit: 'm²' },
      { id: 'banheiros', name: 'Banheiros e Vestiários', index: 200, minIndex: 200, maxIndex: 300, unit: 'm²' },
    ]
  },
  {
    id: 'externas',
    title: 'Áreas Externas',
    icon: <Trees className="w-5 h-5" />,
    items: [
      { id: 'pisos_pavimentados', name: 'Pisos Pavimentados Adjacentes', index: 1800, minIndex: 1800, maxIndex: 2700, unit: 'm²' },
      { id: 'varricao', name: 'Varrição de Passeios e Arruamentos', index: 6000, minIndex: 6000, maxIndex: 9000, unit: 'm²' },
      { id: 'areas_verdes', name: 'Pátios e Áreas Verdes', index: 1800, minIndex: 1800, maxIndex: 2700, unit: 'm²' },
    ]
  },
  {
    id: 'esquadrias',
    title: 'Esquadrias e Vidros',
    icon: <LayoutGrid className="w-5 h-5" />,
    items: [
      { id: 'vidros_comuns', name: 'Face Interna e Externa (sem risco)', index: 300, minIndex: 300, maxIndex: 380, unit: 'm²' },
      { id: 'vidros_risco', name: 'Face Externa (com risco/balancim)', index: 130, minIndex: 130, maxIndex: 160, unit: 'm²' },
      { id: 'fachadas', name: 'Fachadas Envidraçadas (com risco)', index: 130, minIndex: 130, maxIndex: 160, unit: 'm²' },
    ]
  },
  {
    id: 'hospitalar',
    title: 'Áreas Hospitalares',
    icon: <Stethoscope className="w-5 h-5" />,
    items: [
      { id: 'hosp_geral', name: 'Áreas Hospitalares e assemelhadas', index: 360, minIndex: 360, maxIndex: 450, unit: 'm²' },
    ]
  }
];

type Environment = {
  id: string;
  name: string;
  areas: Record<string, number>;
  frequencies: Record<string, number>;
  isExpanded: boolean;
};

export default function App() {
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: 'env-1', name: 'Novo Ambiente 1', areas: {}, frequencies: {}, isExpanded: true }
  ]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] = useState<string | null>(null);
  const [showMinEnvAlert, setShowMinEnvAlert] = useState(false);
  const [customIndices, setCustomIndices] = useState<Record<string, number | ''>>({});

  const handleIndexChange = (itemId: string, value: string) => {
    setCustomIndices(prev => ({
      ...prev,
      [itemId]: value === '' ? '' : Number(value)
    }));
  };

  const handleIndexBlur = (itemId: string, min: number, max: number) => {
    setCustomIndices(prev => {
      const val = prev[itemId];
      if (val === undefined || val === '') return prev;
      let num = Number(val);
      if (num < min) num = min;
      if (num > max) num = max;
      return { ...prev, [itemId]: num };
    });
  };

  const getIndex = (item: any) => {
    const val = customIndices[item.id];
    return (typeof val === 'number') ? val : item.index;
  };

  const getFrequencyLabel = (val: number) => {
    const freq = FREQUENCIES.find(f => f.value === val);
    return freq ? freq.label : 'Padrão (100%)';
  };

  const addEnvironment = () => {
    const newId = `env-${Date.now()}`;
    setEnvironments(prev => [
      ...prev.map(env => ({ ...env, isExpanded: false })), // collapse others
      { id: newId, name: `Novo Ambiente ${prev.length + 1}`, areas: {}, frequencies: {}, isExpanded: true }
    ]);
  };

  const removeEnvironment = (id: string) => {
    if (environments.length === 1) {
      setShowMinEnvAlert(true);
      return;
    }
    setEnvironmentToDelete(id);
  };

  const confirmRemoveEnvironment = () => {
    if (environmentToDelete) {
      setEnvironments(prev => prev.filter(env => env.id !== environmentToDelete));
      setEnvironmentToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    setEnvironments(prev => prev.map(env => 
      env.id === id ? { ...env, isExpanded: !env.isExpanded } : env
    ));
  };

  const updateEnvName = (id: string, name: string) => {
    setEnvironments(prev => prev.map(env => 
      env.id === id ? { ...env, name } : env
    ));
  };

  const handleAreaChange = (envId: string, itemId: string, value: string) => {
    const numValue = parseFloat(value);
    setEnvironments(prev => prev.map(env => {
      if (env.id !== envId) return env;
      return {
        ...env,
        areas: {
          ...env.areas,
          [itemId]: isNaN(numValue) ? 0 : numValue
        }
      };
    }));
  };

  const handleFrequencyChange = (envId: string, itemId: string, value: string) => {
    setEnvironments(prev => prev.map(env => {
      if (env.id !== envId) return env;
      return {
        ...env,
        frequencies: {
          ...env.frequencies,
          [itemId]: parseFloat(value)
        }
      };
    }));
  };

  const clearAll = () => {
    setShowClearModal(true);
  };

  const confirmClear = () => {
    setEnvironments([{ id: 'env-1', name: 'Novo Ambiente 1', areas: {}, frequencies: {}, isExpanded: true }]);
    setShowClearModal(false);
  };

  const handlePrint = () => {
    // Verifica se está rodando dentro de um iframe (como no AI Studio)
    if (window !== window.parent) {
      setShowPrintModal(true);
    } else {
      window.print();
    }
  };

  // Cálculos
  const results = useMemo(() => {
    let grandTotalFTE = 0;
    const envTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    environments.forEach(env => {
      let envTotal = 0;
      
      CATEGORIES.forEach(category => {
        let catTotal = 0;
        category.items.forEach(item => {
          const area = env.areas[item.id] || 0;
          const freq = env.frequencies[item.id] !== undefined ? env.frequencies[item.id] : 1;
          const currentIndex = getIndex(item);
          const fte = (area / currentIndex) * freq;
          
          catTotal += fte;
          envTotal += fte;
          grandTotalFTE += fte;
        });
        
        if (!categoryTotals[category.id]) categoryTotals[category.id] = 0;
        categoryTotals[category.id] += catTotal;
      });
      
      envTotals[env.id] = envTotal;
    });

    return { grandTotalFTE, envTotals, categoryTotals };
  }, [environments, customIndices]);

  const totalHeadcount = Math.ceil(results.grandTotalFTE);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 print:bg-white print:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-green-800 leading-tight">CalcProd Limpeza</h1>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Desenvolvido por Matheus Costa Frade</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Produtividade</span>
            </button>
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Relatório</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:hidden">
        
        {/* Instruções de Uso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0 hidden sm:block">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Como utilizar o CalcProd Limpeza</h2>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Esta ferramenta calcula a estimativa de postos de trabalho necessários para serviços de limpeza e conservação, com base nas faixas de produtividade da <strong>Instrução Normativa nº 5/2017</strong>. Ideal para elaboração de Estudos Técnicos Preliminares (ETP) e Termos de Referência (TR).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                  <span className="font-bold text-green-700 mb-1 block">1º Passo: Ajuste a Produtividade</span>
                  <p className="text-slate-600">Clique no botão <strong>Produtividade</strong> (no topo da tela) para definir os índices de acordo com a realidade do seu órgão, respeitando os limites da IN.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 mb-1 block">2º Passo: Cadastre os Ambientes</span>
                  <p className="text-slate-600">Adicione os ambientes (andares, blocos) e preencha a área (m²) e a frequência de limpeza de cada um para gerar o relatório.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Formulário de Entrada */}
        <div className="flex-1 space-y-6 print:w-full print:mb-8">
          
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div>
              <h2 className="text-xl font-semibold">Ambientes da Instalação</h2>
              <p className="text-sm text-slate-500">
                Adicione andares, blocos ou setores com características distintas.
              </p>
            </div>
            <button
              onClick={addEnvironment}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Ambiente
            </button>
          </div>

          <div className="space-y-6">
            {environments.map((env) => (
              <div key={env.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
                {/* Env Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between print:bg-slate-100">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleExpand(env.id)} className="p-1 hover:bg-slate-200 rounded-md transition-colors print:hidden">
                      {env.isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>
                    <input
                      type="text"
                      value={env.name}
                      onChange={(e) => updateEnvName(env.id, e.target.value)}
                      className="font-semibold text-lg bg-transparent border-none focus:ring-0 p-0 text-slate-800 w-full max-w-md placeholder-slate-400"
                      placeholder="Nome do ambiente (ex: 1º Andar)"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full print:bg-transparent print:text-slate-800 print:px-0">
                      {results.envTotals[env.id].toFixed(2)} postos
                    </div>
                    <button
                      onClick={() => removeEnvironment(env.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors print:hidden"
                      title="Remover ambiente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Env Body */}
                <div className={`${env.isExpanded ? 'block' : 'hidden'} print:block p-6 space-y-8`}>
                  {CATEGORIES.map(category => {
                    // Only show category in print if it has values
                    const hasValues = category.items.some(item => (env.areas[item.id] || 0) > 0);
                    if (!hasValues && window.matchMedia('print').matches) return null;

                    return (
                    <div key={category.id} className={`space-y-4 ${!hasValues ? 'print:hidden' : ''}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-md print:hidden">
                          {category.icon}
                        </div>
                        <h3 className="text-lg font-medium text-slate-800">{category.title}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map(item => {
                          const areaValue = env.areas[item.id] || '';
                          const hasValue = (env.areas[item.id] || 0) > 0;
                          
                          return (
                          <div key={item.id} className={`flex flex-col gap-1.5 ${!hasValue ? 'print:hidden' : ''}`}>
                            <label htmlFor={`${env.id}-${item.id}`} className="text-sm font-medium text-slate-700 flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-xs text-slate-400 font-normal" title="Índice de Produtividade">
                                Índice: {getIndex(item)} {item.unit}/prof.
                              </span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  id={`${env.id}-${item.id}`}
                                  min="0"
                                  step="0.01"
                                  value={areaValue}
                                  onChange={(e) => handleAreaChange(env.id, item.id, e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow outline-none print:bg-transparent print:border-slate-300"
                                  placeholder="0.00"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-slate-400 sm:text-sm">{item.unit}</span>
                                </div>
                              </div>
                              <select
                                value={env.frequencies[item.id] !== undefined ? env.frequencies[item.id] : 1}
                                onChange={(e) => handleFrequencyChange(env.id, item.id, e.target.value)}
                                className="w-2/5 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow outline-none text-sm text-slate-700 print:appearance-none print:bg-transparent print:border-slate-300"
                                title="Frequência de Limpeza"
                              >
                                {FREQUENCIES.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="w-full lg:w-96 space-y-6 print:w-full print:mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24 print:shadow-none print:border-slate-300 print:static">
            <h2 className="text-xl font-semibold mb-6">Dimensionamento</h2>
            
            {/* Totalizador Principal */}
            <div className="bg-green-600 text-white p-6 rounded-xl mb-6 shadow-md print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300 print:shadow-none">
              <div className="text-green-100 text-sm font-medium mb-1 print:text-slate-600">Total Estimado (Postos)</div>
              <div className="text-4xl font-bold tracking-tight mb-2 print:text-slate-900">
                {totalHeadcount} <span className="text-lg font-normal text-green-200 print:text-slate-600">profissionais</span>
              </div>
              <div className="text-sm text-green-200 print:text-slate-600">
                Fração exata: {results.grandTotalFTE.toFixed(2)} postos
              </div>
            </div>

            {/* Detalhamento por Ambiente */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Por Ambiente</h3>
              {environments.map(env => {
                const envTotal = results.envTotals[env.id];
                if (envTotal === 0) return null;
                return (
                  <div key={env.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600 truncate pr-4">{env.name}</span>
                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{envTotal.toFixed(2)} postos</span>
                  </div>
                );
              })}
            </div>

            {/* Detalhamento por Categoria */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Por Categoria (Global)</h3>
              
              {CATEGORIES.map(category => {
                const catTotal = results.categoryTotals[category.id];
                if (!catTotal) return null;
                
                return (
                  <div key={category.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{category.title}</span>
                    <span className="text-sm font-medium text-slate-900">{catTotal.toFixed(2)} postos</span>
                  </div>
                );
              })}

              {results.grandTotalFTE === 0 && (
                <div className="text-sm text-slate-500 text-center py-4 italic">
                  Preencha as áreas para ver o dimensionamento.
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 print:bg-white print:border-slate-300">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 print:text-slate-600" />
              <div className="text-xs text-blue-800 leading-relaxed print:text-slate-700">
                <p className="font-semibold mb-1">Base Legal</p>
                <p>
                  Cálculo baseado nos índices de produtividade da <strong>Instrução Normativa nº 5/2017</strong> (Anexo VI-B) do Ministério do Planejamento (atual MGI), utilizada para contratação de serviços terceirizados na Administração Pública Federal.
                </p>
                <p className="mt-2">
                  <strong>Periodicidade:</strong> O Caderno de Logística permite a adequação da produtividade em função da frequência de limpeza. Reduzir a frequência diminui proporcionalmente a necessidade de postos, desde que justificado no Estudo Técnico Preliminar (ETP).
                </p>
                <p className="mt-2">
                  * O total de profissionais é arredondado para cima para garantir a cobertura total da área.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

      </main>

      {/* Relatório de Impressão (Visível apenas na impressão) */}
      <div className="hidden print:block w-full max-w-5xl mx-auto bg-white text-slate-900 text-sm p-4">
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Relatório de Dimensionamento de Limpeza</h1>
            <p className="text-slate-500 mt-1">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            <p className="text-slate-500 mt-1 text-xs font-medium">Desenvolvido por Matheus Costa Frade</p>
          </div>
          <div className="flex items-center justify-center">
            <AppLogo className="w-14 h-14" iconSize="w-8 h-8" badgeSize="w-5 h-5" />
          </div>
        </div>

        <div className="mb-8 flex gap-8">
          <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Estimado</p>
            <p className="text-3xl font-bold text-green-700">{totalHeadcount} <span className="text-base font-normal text-slate-600">profissionais</span></p>
            <p className="text-sm text-slate-600 mt-1">Fração exata: {results.grandTotalFTE.toFixed(2)} postos</p>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase border-b border-slate-200 pb-1 mb-2">Resumo por Categoria</h2>
            <table className="w-full text-sm">
              <tbody>
                {CATEGORIES.map(cat => {
                  const catTotal = results.categoryTotals[cat.id];
                  if (!catTotal) return null;
                  return (
                    <tr key={cat.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 font-medium text-slate-700">{cat.title}</td>
                      <td className="py-1.5 text-right font-semibold">{catTotal.toFixed(2)} postos</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-200 pb-2 mb-4">Detalhamento por Ambiente</h2>
          {environments.map(env => {
            if (results.envTotals[env.id] === 0) return null;
            return (
              <div key={env.id} className="mb-6 break-inside-avoid border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-800">{env.name}</h3>
                  <span className="font-bold text-green-700">Subtotal: {results.envTotals[env.id].toFixed(2)} postos</span>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="text-left py-2 px-4 font-semibold">Categoria / Item</th>
                      <th className="text-right py-2 px-4 font-semibold">Área</th>
                      <th className="text-right py-2 px-4 font-semibold">Frequência</th>
                      <th className="text-right py-2 px-4 font-semibold">Índice</th>
                      <th className="text-right py-2 px-4 font-semibold">Postos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map(cat => {
                      const items = cat.items.filter(item => (env.areas[item.id] || 0) > 0);
                      if (items.length === 0) return null;
                      return items.map((item) => {
                        const area = env.areas[item.id] || 0;
                        const freqVal = env.frequencies[item.id] !== undefined ? env.frequencies[item.id] : 1;
                        const freqLabel = getFrequencyLabel(freqVal);
                        const currentIndex = getIndex(item);
                        const fte = (area / currentIndex) * freqVal;
                        return (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-4">
                              <span className="font-medium text-slate-700">{cat.title}</span>
                              <span className="text-slate-400 mx-1">-</span>
                              {item.name}
                            </td>
                            <td className="py-2 px-4 text-right">{area.toFixed(2)} {item.unit}</td>
                            <td className="py-2 px-4 text-right text-slate-600">{freqLabel}</td>
                            <td className="py-2 px-4 text-right text-slate-600">{currentIndex} {item.unit}/prof.</td>
                            <td className="py-2 px-4 text-right font-semibold text-slate-800">{fte.toFixed(2)}</td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-xs text-slate-500 border-t border-slate-200 pt-4 text-center space-y-1">
          <p>Relatório gerado pelo <strong>CalcProd Limpeza</strong>.</p>
          <p>Cálculos baseados na Instrução Normativa nº 5/2017 (Anexo VI-B) do Ministério da Gestão e da Inovação em Serviços Públicos.</p>
          <p className="pt-2 font-medium">Desenvolvido por Matheus Costa Frade</p>
        </div>
      </div>

      {/* Modal de Configurações de Produtividade */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-green-600">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Configurar Produtividade</h3>
                  <p className="text-sm text-slate-500 font-normal">Ajuste os índices dentro das faixas da IN 5/2017</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="space-y-8">
                {CATEGORIES.map(category => (
                  <div key={category.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <div className="text-green-600">{category.icon}</div>
                      <h4 className="font-medium text-slate-800">{category.title}</h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {category.items.map(item => (
                        <div key={item.id} className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-slate-700 flex justify-between">
                            <span className="truncate pr-2" title={item.name}>{item.name}</span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              Faixa: {item.minIndex} a {item.maxIndex}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={item.minIndex}
                              max={item.maxIndex}
                              value={customIndices[item.id] !== undefined ? customIndices[item.id] : item.index}
                              onChange={(e) => handleIndexChange(item.id, e.target.value)}
                              onBlur={() => handleIndexBlur(item.id, item.minIndex, item.maxIndex)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 sm:text-sm">{item.unit}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center">
              <button
                onClick={() => setCustomIndices({})}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                Restaurar Padrões
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aviso de Impressão */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-green-600">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Impressão do Relatório</h3>
                </div>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-slate-600 space-y-4 mb-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 text-sm leading-relaxed">
                  <p className="font-semibold mb-1">Por que estou vendo este aviso?</p>
                  <p>Você está testando o aplicativo dentro do painel do <strong>Google AI Studio</strong>. Por segurança, os navegadores bloqueiam a impressão direta de aplicativos embutidos aqui.</p>
                  <p className="mt-2 font-medium">Quando você publicar ou compartilhar o aplicativo, a impressão funcionará normalmente com apenas um clique!</p>
                </div>
                
                <p className="font-medium text-slate-900">Para testar a impressão agora (gerar PDF):</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Clique no botão azul abaixo para abrir o app em uma nova guia.</li>
                    <li>Na nova guia, clique novamente em <strong>Imprimir Relatório</strong>.</li>
                    <li>Escolha a opção <strong>Salvar como PDF</strong> na janela do navegador.</li>
                  </ol>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowPrintModal(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em Nova Guia
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Limpar */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Limpar todos os dados?</h3>
                </div>
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja apagar todas as áreas e frequências preenchidas? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmClear}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sim, limpar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Ambiente */}
      {environmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Remover Ambiente</h3>
                </div>
                <button 
                  onClick={() => setEnvironmentToDelete(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja remover este ambiente? Todos os dados preenchidos nele serão perdidos.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEnvironmentToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemoveEnvironment}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sim, remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Mínimo de Ambientes */}
      {showMinEnvAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Atenção</h3>
                </div>
                <button 
                  onClick={() => setShowMinEnvAlert(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                É necessário ter pelo menos um ambiente cadastrado no relatório.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowMinEnvAlert(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
