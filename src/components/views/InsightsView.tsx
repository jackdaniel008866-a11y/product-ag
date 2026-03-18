import type { Initiative, Stage } from '../../types';
import { differenceInDays } from 'date-fns';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

interface InsightsViewProps {
  initiatives: Initiative[];
}

export default function InsightsView({ initiatives }: InsightsViewProps) {
  const activeStages = ['Roadmap', 'Planning', 'Execution', 'Testing', 'Deployed'];
  
  const positiveSignals: string[] = [];
  const riskSignals: string[] = [];
  const suggestedActions: string[] = [];

  // Data pre-processing
  const totalActive = initiatives.filter(i => activeStages.includes(i.stage)).length;
  const roadmapCount = initiatives.filter(i => i.stage === 'Roadmap').length;
  const planningCount = initiatives.filter(i => i.stage === 'Planning').length;
  const executionCount = initiatives.filter(i => i.stage === 'Execution').length;
  const testingCount = initiatives.filter(i => i.stage === 'Testing').length;
  const deployedCount = initiatives.filter(i => i.stage === 'Deployed').length;
  const parkedCount = initiatives.filter(i => i.stage === 'Parked').length;

  // 1. FLOW PROGRESSION LOGIC
  let forwardMoves = 0;
  let totalMoves = 0;
  
  initiatives.forEach(init => {
    if (init.stageHistory && init.stageHistory.length > 1) {
      for (let i = 1; i < init.stageHistory.length; i++) {
        const prev = init.stageHistory[i-1].stage;
        const curr = init.stageHistory[i].stage;
        totalMoves++;
        
        if (
          (prev === 'Roadmap' && curr === 'Planning') ||
          (prev === 'Planning' && curr === 'Execution') ||
          (prev === 'Execution' && curr === 'Testing') ||
          (prev === 'Testing' && curr === 'Deployed')
        ) {
          forwardMoves++;
        }
      }
    }
  });

  const flowScoreRatio = totalMoves > 0 ? forwardMoves / totalMoves : 0;
  let flowScore = 0;
  if (flowScoreRatio >= 0.65) {
    flowScore = 100;
  } else if (flowScoreRatio >= 0.45) {
    flowScore = 50;
  } else {
    flowScore = 0;
  }

  if (flowScore === 100) positiveSignals.push('Healthy forward progression pipeline');
  else if (flowScore === 0 && totalMoves > 0) riskSignals.push('High volume of backward or parked transitions');

  // 2. STAGE BALANCE LOGIC
  let balanceScore = 100;
  if (totalActive > 0) {
    const rRatio = roadmapCount / totalActive;
    const pRatio = planningCount / totalActive;
    
    if (rRatio > 0.40) {
      balanceScore -= 20;
      riskSignals.push('Too much ideation, not enough execution (Roadmap > 40%)');
      suggestedActions.push('Reduce Roadmap overload by pausing new ideas');
    }
    if (pRatio > 0.35) {
      balanceScore -= 20;
      riskSignals.push('Planning bottleneck detected (Planning > 35%)');
      suggestedActions.push('Move validated initiatives from Planning to Execution');
    }
    if (executionCount === 0 && (roadmapCount + planningCount) >= 3) {
      balanceScore -= 40;
      riskSignals.push('No active build despite heavy pipeline');
      suggestedActions.push('Unblock execution pipeline immediately');
    }
    if (executionCount > 0 && testingCount === 0) {
      balanceScore -= 20;
      riskSignals.push('Testing / QA visibility issue (No active testing items)');
      suggestedActions.push('Validate missing Testing stage workflow');
    }
    
    if (executionCount >= 1 && testingCount >= 1 && deployedCount >= 1) {
      positiveSignals.push('Balanced pipeline across delivery stages');
    }
  } else {
    balanceScore = 0;
    riskSignals.push('No active initiatives in the pipeline');
  }
  balanceScore = Math.max(0, balanceScore);

  // 3. STUCK / AGING LOGIC
  const thresholds: Record<Stage, number> = {
    Roadmap: 90, Planning: 5, Execution: 21, Testing: 5, Deployed: 31, Parked: 999
  };
  
  let stuckCount = 0;
  let stuckInPlanning = 0;
  let stuckInExecution = 0;
  let stuckInTesting = 0;

  initiatives.forEach(init => {
    if (init.stage === 'Parked') return;
    const days = differenceInDays(new Date(), new Date(init.stageUpdatedAt));
    if (days > thresholds[init.stage]) {
      stuckCount++;
      if (init.stage === 'Planning') stuckInPlanning++;
      if (init.stage === 'Execution') stuckInExecution++;
      if (init.stage === 'Testing') stuckInTesting++;
    }
  });

  const stuckRatio = totalActive > 0 ? stuckCount / totalActive : 0;
  let stuckScore = 100;
  if (stuckRatio <= 0.15) {
    stuckScore = 100;
  } else if (stuckRatio <= 0.30) {
    stuckScore = 50;
    riskSignals.push('Moderate volume of aging/stuck initiatives');
  } else {
    stuckScore = 0;
    riskSignals.push('High Risk: Exessive aging initiatives blocking pipeline');
    suggestedActions.push('Review items stuck > threshold across the board');
  }

  if (stuckInPlanning > Math.max(stuckInExecution, stuckInTesting) && stuckInPlanning > 0) {
    riskSignals.push('Requirement clarity issue (Most stuck in Planning)');
    suggestedActions.push('Review stuck Planning items with design/product teams');
  } else if (stuckInExecution > Math.max(stuckInPlanning, stuckInTesting) && stuckInExecution > 0) {
    riskSignals.push('Engineering bottleneck (Most stuck in Execution)');
    suggestedActions.push('Address Execution blockers with engineering team');
  } else if (stuckInTesting > Math.max(stuckInExecution, stuckInPlanning) && stuckInTesting > 0) {
    riskSignals.push('Release delay (Most stuck in Testing)');
  }

  if (stuckScore === 100 && totalActive > 0) positiveSignals.push('Fast movement (Low stuck ratio)');

  // 4. DELIVERY SIGNAL LOGIC
  let deployedInTimeframe = 0;
  let enteredExecutionInTimeframe = 0;
  
  initiatives.forEach(init => {
    if (!init.stageHistory) return;
    
    const deployedTrans = init.stageHistory.find(h => h.stage === 'Deployed');
    if (deployedTrans && differenceInDays(new Date(), new Date(deployedTrans.enteredAt)) <= 30) {
      deployedInTimeframe++;
    }
    
    const execTrans = init.stageHistory.find(h => h.stage === 'Execution');
    if (execTrans && differenceInDays(new Date(), new Date(execTrans.enteredAt)) <= 30) {
      enteredExecutionInTimeframe++;
    }
  });

  const execToDepRatio = enteredExecutionInTimeframe > 0 ? deployedInTimeframe / enteredExecutionInTimeframe : 0;
  let deliveryScore = 100;
  
  if (deployedInTimeframe === 0 && enteredExecutionInTimeframe > 0) {
    deliveryScore = 0;
    riskSignals.push('No delivery signal (0 deployments recently)');
  } else if (execToDepRatio >= 0.4) {
    deliveryScore = 100;
    positiveSignals.push('Strong conversion from Execution to Deployed');
  } else if (execToDepRatio < 0.4 && enteredExecutionInTimeframe > 0) {
    deliveryScore = 50;
    riskSignals.push('Weak finish rate (Execution items failing to deploy)');
  } else {
    deliveryScore = 50;
  }

  // 5. PARKED LOGIC
  const parkedRatio = (totalActive + parkedCount) > 0 ? parkedCount / (totalActive + parkedCount) : 0;
  let parkedScore = 100;
  
  if (parkedRatio <= 0.15) {
    positiveSignals.push('Low parked ratio (Strong focus)');
  } else if (parkedRatio <= 0.30) {
    parkedScore = 50;
  } else {
    parkedScore = 0;
    riskSignals.push('Poor prioritization (High parked ratio)');
  }
  
  let parkedFromPlanning = 0;
  let parkedFromExecution = 0;
  initiatives.forEach(init => {
    if (init.stage === 'Parked' && init.stageHistory && init.stageHistory.length >= 2) {
      const prev = init.stageHistory[init.stageHistory.length - 2].stage;
      if (prev === 'Planning') parkedFromPlanning++;
      if (prev === 'Execution') parkedFromExecution++;
    }
  });
  if (parkedFromPlanning > 0) riskSignals.push('Unclear requirements (Items parked directly from Planning)');
  if (parkedFromExecution > 0) riskSignals.push('Wasted effort (Items parked out of active Execution)');

  // Truncate signals to max 3
  const topPositive = positiveSignals.slice(0, 3);
  const topRisk = riskSignals.slice(0, 3);
  const topActions = suggestedActions.slice(0, 3);

  // FINAL SCORING MODEL
  const finalScore = Math.round(
    (flowScore * 0.30) +
    (balanceScore * 0.20) +
    (stuckScore * 0.20) +
    (deliveryScore * 0.20) +
    (parkedScore * 0.10)
  );
  
  let statusText = 'Off Track';
  let statusColor = 'text-red-700 bg-red-50 border-red-200';
  let icon = <TrendingDown className="w-8 h-8 text-red-500" />;
  
  if (finalScore >= 80) {
    statusText = 'On Track';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    icon = <TrendingUp className="w-8 h-8 text-emerald-500" />;
  } else if (finalScore >= 60) {
    statusText = 'Needs Attention';
    statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    icon = <Activity className="w-8 h-8 text-amber-500" />;
  }

  if (totalActive === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-5xl mx-auto py-4">
         <Activity className="w-16 h-16 text-slate-300 mb-4" />
         <h2 className="text-xl font-bold text-slate-800">Insufficient Data</h2>
         <p className="text-slate-500">The Insights Engine requires active initiatives to calculate direction signals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Direction Intelligence
        </h2>
        <p className="text-slate-500 text-sm mt-1">Algorithmic pipeline analysis generating strategic operational insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Main Score Card */}
        <div className={`col-span-1 md:col-span-3 rounded-2xl border p-6 shadow-sm flex items-center justify-between ${statusColor}`}>
          <div>
            <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Overall Direction</h3>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl font-black">{finalScore}</span>
              <span className="text-lg font-bold opacity-80">/ 100</span>
            </div>
            <div className="mt-2 font-bold text-lg flex items-center gap-2">
              {icon}
              {statusText}
            </div>
          </div>
          <div className="hidden md:block w-32 h-32 rounded-full border-8 border-current opacity-20 flex items-center justify-center relative">
             <div className="absolute inset-2 rounded-full border-4 border-current border-dashed opacity-50 animate-spin-slow"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Positive Signals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle className="text-emerald-600 w-5 h-5" />
            <h3 className="font-bold text-emerald-900">Positive Signals</h3>
          </div>
          <div className="p-5 flex-1 space-y-3">
            {topPositive.length > 0 ? topPositive.map((sig, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>{sig}</span>
              </div>
            )) : (
               <p className="text-slate-400 text-sm italic py-4">No dominant positive signals detected.</p>
            )}
          </div>
        </div>

        {/* Risk Signals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <h3 className="font-bold text-red-900">Risk Signals</h3>
          </div>
          <div className="p-5 flex-1 space-y-3">
            {topRisk.length > 0 ? topRisk.map((sig, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                <span>{sig}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic py-4">No critical risk signals detected.</p>
            )}
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center gap-2">
            <Lightbulb className="text-indigo-600 w-5 h-5" />
            <h3 className="font-bold text-indigo-900">Suggested Actions</h3>
          </div>
          <div className="p-5 flex-1 space-y-3">
            {topActions.length > 0 ? topActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-indigo-600 shrink-0">👉</span>
                <span>{action}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic py-4">Pipeline operating optimally.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
