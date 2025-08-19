



import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, Client, ServiceType } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
    <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>
    <div className="h-72 md:h-96"> 
      {children}
    </div>
  </div>
);

const KPICard: React.FC<{ title: string; value: string | number; unit?: string; isCurrency?: boolean; privacyModeEnabled?: boolean }> = 
  ({ title, value, unit, isCurrency = false, privacyModeEnabled = false }) => (
  <div className="bg-card-bg p-6 rounded-xl shadow-lg text-center border border-border-color">
    <h3 className="text-md font-medium text-text-secondary mb-1">{title}</h3>
    <p className="text-3xl font-bold text-blue-600">
      {isCurrency 
        ? formatCurrency(typeof value === 'number' ? value : parseFloat(value.toString()), privacyModeEnabled) 
        : (typeof value === 'number' ? value.toLocaleString('pt-BR', {minimumFractionDigits: 1 , maximumFractionDigits: 1}) : value)
      }
      {!isCurrency && unit && <span className="text-lg ml-1">{unit}</span>}
    </p>
  </div>
);


const PerformancePage: React.FC = () => {
  const { jobs, clients, settings, loading } = useAppData();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  const privacyMode = settings.privacyModeEnabled || false;
  const activeJobs = jobs.filter(job => !job.isDeleted);
  const paidJobs = activeJobs.filter(job => getJobPaymentSummary(job).isFullyPaid);

  const monthlyMetricsMap = activeJobs
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
        acc[yearMonthKey].jobsPaidInMonth.add(payment.job.id);

      } catch (e) { console.warn("Error processing revenue date", payment, e); }
      return acc;
    }, {} as { [key: string]: { revenue: number, jobsPaidInMonth: Set<string> } });
  
  // Calculate costs and profits based on jobs fully paid in that month
  Object.keys(monthlyMetricsMap).forEach(key => {
    const jobIds = monthlyMetricsMap[key].jobsPaidInMonth;
    const cost = Array.from(jobIds)
        .map(id => jobs.find(j => j.id === id))
        .filter(job => job && getJobPaymentSummary(job).isFullyPaid)
        .reduce((sum, job) => sum + (job?.cost || 0), 0);
    
    (monthlyMetricsMap[key] as any).cost = cost;
    (monthlyMetricsMap[key] as any).profit = monthlyMetricsMap[key].revenue - cost;
    (monthlyMetricsMap[key] as any).completedJobs = jobIds.size;
  });


  const metricsData = Object.entries(monthlyMetricsMap)
    .map(([yearMonthKey, data]) => {
      const [yearStr, monthStr] = yearMonthKey.split('-');
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      return { 
        key: yearMonthKey, 
        name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), 
        Receita: data.revenue,
        Custo: (data as any).cost,
        Lucro: (data as any).profit,
        Quantidade: (data as any).completedJobs
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key)).slice(-12);


  // Top Clientes por Receita Paga
  const clientRevenue = clients.map(client => {
    const total = activeJobs
      .filter(job => job.clientId === client.id)
      .reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0);
    return { name: client.name, value: total };
  }).filter(c => c.value > 0).sort((a,b) => b.value - a.value).slice(0,5); 

  // Receita por Categoria de Serviço
  const serviceRevenue = Object.values(ServiceType).map(service => {
    const total = activeJobs
      .filter(job => job.serviceType === service)
      .reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0);
    return { name: service, value: total };
  }).filter(s => s.value > 0).sort((a,b) => b.value - a.value);

  // Custos por Categoria de Serviço
  const serviceCosts = Object.values(ServiceType).map(service => {
    const total = paidJobs
      .filter(job => job.serviceType === service)
      .reduce((sum, job) => sum + (job.cost || 0), 0);
    return { name: service, value: total };
  }).filter(s => s.value > 0).sort((a,b) => b.value - a.value);

  const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7']; // blue, green, orange, red, purple

  // Valor Médio por Job (Pago)
  const averageJobValue = paidJobs.length > 0 ? paidJobs.reduce((sum, job) => sum + job.value, 0) / paidJobs.length : 0;

  // Tempo Médio de Conclusão (do createdAt até o último pagamento)
  const completedJobsWithTimes = paidJobs.filter(job => job.createdAt && job.payments.length > 0);
  const averageCompletionTime = completedJobsWithTimes.length > 0 
    ? completedJobsWithTimes.reduce((sum, job) => {
        try {
          const start = new Date(job.createdAt).getTime();
          const lastPaymentDate = new Date(Math.max(...job.payments.map(p => new Date(p.date).getTime()))).getTime();
          if (isNaN(start) || isNaN(lastPaymentDate) || lastPaymentDate < start) return sum; 
          return sum + (lastPaymentDate - start);
        } catch (e) {
          console.warn("Error calculating completion time for job", job.id, e);
          return sum;
        }
      }, 0) / completedJobsWithTimes.length / (1000 * 60 * 60 * 24) 
    : 0;

  const currencyTooltipFormatter = (value: number, name: string) => [formatCurrency(value, privacyMode), name];
  const countTooltipFormatter = (value: number) => [value.toString(), "Quantidade"];
  const currencyAxisTickFormatter = (value: number) => privacyMode ? 'R$•••' : `R$${(value/1000).toFixed(0)}k`;
  const countAxisTickFormatter = (value: number) => value.toString();

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Painel de Desempenho</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <KPICard title="Valor Médio por Projeto (Pago)" value={averageJobValue} isCurrency={true} privacyModeEnabled={privacyMode} />
        <KPICard title="Tempo Médio de Pagamento" value={averageCompletionTime.toFixed(1)} unit="dias" />
      </div>

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
          ) : <p className="text-text-secondary text-center pt-10">Dados insuficientes.</p>}
        </ChartCard>

        <ChartCard title="Evolução da Lucratividade Mensal">
          {metricsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickFormatter={currencyAxisTickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={currencyTooltipFormatter} />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={2} isAnimationActive={true} animationDuration={500} />
                <Line type="monotone" dataKey="Custo" stroke="#f43f5e" strokeWidth={2} isAnimationActive={true} animationDuration={500} />
                <Line type="monotone" dataKey="Lucro" stroke="#22c55e" strokeWidth={3} isAnimationActive={true} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-text-secondary text-center pt-10">Dados insuficientes (requer custos nos jobs).</p>}
        </ChartCard>
        
        <ChartCard title="Custos por Categoria de Serviço (Jobs Pagos)">
           {serviceCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                    isAnimationActive={true}
                    animationDuration={500}
                    data={serviceCosts} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" cy="50%" 
                    outerRadius={100} 
                    labelLine={false} 
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {serviceCosts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, privacyMode)}/>
                <Legend wrapperStyle={{fontSize: "14px"}}/>
              </PieChart>
            </ResponsiveContainer>
           ) : <p className="text-text-secondary text-center pt-10">Sem custos registrados em jobs pagos.</p>}
        </ChartCard>

        <ChartCard title="Receita por Tipo de Serviço">
          {serviceRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={serviceRevenue} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={currencyAxisTickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, privacyMode)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={true} animationDuration={500}>
                    {serviceRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ): <p className="text-text-secondary text-center pt-10">Dados insuficientes.</p>}
        </ChartCard>
      </div>
    </div>
  );
};

export default PerformancePage;