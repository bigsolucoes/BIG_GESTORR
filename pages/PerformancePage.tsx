
import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, Client, ServiceType, JobStatus } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PrinterIcon, ChevronLeftIcon, ChevronRightIcon } from '../constants';

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-card-bg p-6 rounded-xl shadow-lg border border-border-color printable-area ${className}`}>
    <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>
    <div className="h-72 md:h-80"> 
      {children}
    </div>
  </div>
);

const KPICard: React.FC<{ title: string; value: string | number; unit?: string; isCurrency?: boolean; privacyModeEnabled?: boolean }> = 
  ({ title, value, unit, isCurrency = false, privacyModeEnabled = false }) => (
  <div className="bg-card-bg p-6 rounded-xl shadow-lg text-center border border-border-color printable-area">
    <h3 className="text-md font-medium text-text-secondary mb-1">{title}</h3>
    <p className="text-3xl font-bold text-accent">
      {isCurrency 
        ? formatCurrency(typeof value === 'number' ? value : parseFloat(value.toString()), privacyModeEnabled) 
        : (typeof value === 'number' ? value.toLocaleString('pt-BR', {minimumFractionDigits: 1 , maximumFractionDigits: 1}) : value)
      }
      {!isCurrency && unit && <span className="text-lg ml-1">{unit}</span>}
    </p>
  </div>
);

const NoData: React.FC<{ message?: string }> = ({ message = "Dados insuficientes para exibir o gráfico." }) => (
  <div className="flex items-center justify-center h-full text-text-secondary">
    <p>{message}</p>
  </div>
);

// --- Page Components ---

const PageOne: React.FC = () => {
    const { jobs, settings } = useAppData();
    const privacyMode = settings.privacyModeEnabled || false;

    const monthlyMetricsMap = jobs
    .filter(j => !j.isDeleted)
    .flatMap(job => job.payments.map(p => ({ ...p, job })))
    .reduce((acc, payment) => {
      try {
        const date = new Date(payment.date);
        if (isNaN(date.getTime())) return acc; 
        const yearMonthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!acc[yearMonthKey]) {
            acc[yearMonthKey] = { revenue: 0, jobsPaidInMonth: new Set() };
        }
        acc[yearMonthKey].revenue += payment.amount;
        if(getJobPaymentSummary(payment.job).isFullyPaid){
            acc[yearMonthKey].jobsPaidInMonth.add(payment.job.id);
        }

      } catch (e) { console.warn("Error processing revenue date", payment, e); }
      return acc;
    }, {} as { [key: string]: { revenue: number, jobsPaidInMonth: Set<string> } });
  
  Object.keys(monthlyMetricsMap).forEach(key => {
    const jobIds = monthlyMetricsMap[key].jobsPaidInMonth;
    const cost = Array.from(jobIds)
        .map(id => jobs.find(j => j.id === id))
        .filter((j): j is Job => !!j)
        .reduce((sum, job) => sum + (job.cost || 0), 0);
    
    (monthlyMetricsMap[key] as any).cost = cost;
    (monthlyMetricsMap[key] as any).profit = monthlyMetricsMap[key].revenue - cost;
  });

  const metricsData = Object.entries(monthlyMetricsMap)
    .map(([yearMonthKey, data]) => ({ 
        name: new Date(yearMonthKey + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), 
        Receita: data.revenue,
        Custo: (data as any).cost,
        Lucro: (data as any).profit,
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-12);
    
    const currencyTooltipFormatter = (value: number, name: string) => [formatCurrency(value, privacyMode), name];
    const currencyAxisTickFormatter = (value: number) => privacyMode ? 'R$•••' : `R$${(value/1000).toFixed(0)}k`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Faturamento Mensal (Últimos 12 meses)">
                {metricsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tickFormatter={currencyAxisTickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip formatter={currencyTooltipFormatter} />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={500} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>

            <ChartCard title="Evolução da Lucratividade Mensal">
                {metricsData.filter(d => d.Custo > 0).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tickFormatter={currencyAxisTickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip formatter={currencyTooltipFormatter} />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Custo" stroke="#f43f5e" strokeWidth={2} />
                        <Line type="monotone" dataKey="Lucro" stroke="#22c55e" strokeWidth={3} />
                    </LineChart>
                    </ResponsiveContainer>
                ) : <NoData message="Dados insuficientes (requer custos nos jobs)." />}
            </ChartCard>
        </div>
    );
};

const PageTwo: React.FC = () => {
    const { jobs, clients, settings } = useAppData();
    const privacyMode = settings.privacyModeEnabled || false;

    const activeJobs = jobs.filter(job => !job.isDeleted);
    
    const clientRevenue = clients.map(client => ({
        name: client.name,
        Receita: activeJobs.filter(job => job.clientId === client.id)
                          .reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0)
    })).filter(c => c.Receita > 0).sort((a,b) => b.Receita - a.Receita).slice(0, 5);

    const clientAcquisitionByMonth = clients.reduce((acc, client) => {
        const key = new Date(client.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const clientAcquisitionData = Object.entries(clientAcquisitionByMonth).map(([name, value]) => ({ name, 'Novos Clientes': value })).slice(-12);
    
    const serviceRevenue = Object.values(ServiceType).map(service => ({
        name: service,
        Receita: activeJobs.filter(j => j.serviceType === service).reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0)
    })).filter(s => s.Receita > 0).sort((a, b) => b.Receita - a.Receita);
    
    const totalRevenue = activeJobs.reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0);
    const arpc = clients.length > 0 ? totalRevenue / clients.length : 0;
    
    const currencyTooltipFormatter = (value: number, name: string) => [formatCurrency(value, privacyMode), name];
    const currencyAxisTickFormatter = (value: number) => privacyMode ? 'R$•••' : `R$${(value/1000).toFixed(0)}k`;
    const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <KPICard title="Valor Médio por Cliente (ARPC)" value={arpc} isCurrency={true} privacyModeEnabled={privacyMode} />
                 <KPICard title="Total de Clientes" value={clients.length} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top 5 Clientes por Receita">
                   {clientRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={currencyAxisTickFormatter} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={currencyTooltipFormatter} />
                        <Bar dataKey="Receita" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                   ) : <NoData />}
                </ChartCard>
                <ChartCard title="Aquisição de Novos Clientes">
                    {clientAcquisitionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={clientAcquisitionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Novos Clientes" stroke="#22c55e" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    ) : <NoData />}
                </ChartCard>
            </div>
        </div>
    );
};

const PageThree: React.FC = () => {
    const { jobs, clients } = useAppData();
    const activeJobs = jobs.filter(j => !j.isDeleted && j.status !== JobStatus.PAID);
    const paidJobs = jobs.filter(j => getJobPaymentSummary(j).isFullyPaid);
    
    const statusCounts = activeJobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const statusDistributionData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const today = new Date(); today.setHours(0,0,0,0);
    const overdueJobs = activeJobs.filter(job => new Date(job.deadline) < today && job.status !== JobStatus.FINALIZED);
    
    const serviceProfitability = Object.values(ServiceType).map(service => {
        const jobsInService = paidJobs.filter(j => j.serviceType === service);
        const totalValue = jobsInService.reduce((sum, j) => sum + j.value, 0);
        const totalCost = jobsInService.reduce((sum, j) => sum + (j.cost || 0), 0);
        const margin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
        return { name: service, 'Margem (%)': parseFloat(margin.toFixed(1)) };
    }).filter(s => s['Margem (%)'] > 0);

    const PIE_COLORS = ['#64748b', '#a855f7', '#eab308', '#3b82f6', '#f97316'];
    const percentTooltipFormatter = (value: number) => [`${value.toFixed(1)}%`, 'Margem'];
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Distribuição de Status (Jobs Ativos)">
                {statusDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={statusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {statusDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                ): <NoData />}
            </ChartCard>
            <ChartCard title="Margem de Lucro por Serviço (Jobs Pagos)">
                {serviceProfitability.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceProfitability}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis unit="%" />
                        <Tooltip formatter={percentTooltipFormatter} />
                        <Bar dataKey="Margem (%)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                ): <NoData message="Requer jobs pagos com custos registrados." />}
            </ChartCard>
            <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color lg:col-span-2 printable-area">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Projetos Atrasados ({overdueJobs.length})</h2>
                {overdueJobs.length > 0 ? (
                <ul className="divide-y divide-border-color max-h-80 overflow-y-auto">
                    {overdueJobs.map(job => (
                    <li key={job.id} className="py-2 flex justify-between items-center">
                        <div>
                        <p className="font-medium text-text-primary">{job.name}</p>
                        <p className="text-sm text-text-secondary">{clients.find(c => c.id === job.clientId)?.name}</p>
                        </div>
                        <p className="text-sm font-semibold text-red-500">Prazo: {formatDate(job.deadline)}</p>
                    </li>
                    ))}
                </ul>
                ) : <p className="text-text-secondary">Nenhum projeto atrasado. Bom trabalho!</p>}
            </div>
        </div>
    );
};


const PerformancePage: React.FC = () => {
  const { loading } = useAppData();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 no-print">
        <h1 className="text-3xl font-bold text-text-primary">Painel de Desempenho</h1>
        <div className="flex items-center space-x-2">
            <button onClick={handlePrint} className="flex items-center bg-slate-600 text-white px-3 py-2 rounded-lg shadow hover:bg-slate-700 transition-colors text-sm">
                <PrinterIcon size={18} className="mr-2" /> Imprimir
            </button>
            <div className="flex items-center space-x-1 p-1 bg-slate-200 rounded-lg">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 hover:bg-slate-300">
                    <ChevronLeftIcon size={20} />
                </button>
                <span className="text-sm font-semibold text-text-secondary px-2">Página {currentPage} de {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 hover:bg-slate-300">
                    <ChevronRightIcon size={20} />
                </button>
            </div>
        </div>
      </div>
      
      <div className="printable-container">
        {currentPage === 1 && <PageOne />}
        {currentPage === 2 && <PageTwo />}
        {currentPage === 3 && <PageThree />}
      </div>
    </div>
  );
};

export default PerformancePage;