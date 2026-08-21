import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal, Cpu, Play, Loader2, ChevronRight } from 'lucide-react';

interface FrameworkSDK {
  id: string;
  name: string;
  badge: string;
  lang: string;
  installCmd: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  getCode: (apiKey: string, endpoint: string, userId: string) => string;
}

const FRAMEWORKS: FrameworkSDK[] = [
  {
    id: 'mem0_dropin',
    name: 'Mem0 Drop-in',
    badge: 'Drop-In Drop-Out',
    lang: 'python',
    installCmd: 'pip install palimn-ai hydradb',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    getCode: (apiKey, endpoint, userId) => `from palimn import PalimnMemory

# 1. Initialize PALIMN as a drop-in 1:1 replacement for Mem0
memory = PalimnMemory(
    api_key="${apiKey || 'hydra_live_xxx'}",
    base_url="${endpoint || 'http://localhost:8000'}",
    database="palimn-memory",
    default_user_id="${userId || 'user_agent_01'}"
)

# 2. Add memories across sessions (auto-builds SUPERSEDES graph)
memory.add("I moved from Bangalore to Hyderabad for my new role at Microsoft")

# 3. Query with calibrated abstention & chronological reasoning
result = memory.search("Where did I live before Hyderabad?")
print(result["reply"])  # -> "Bangalore"

# 4. Verify cryptographic abstention proof for absent facts
cert = memory.evaluate_abstention("What is my spaceship model?")
print(cert["decision"])  # -> "abstain" (100% Calibrated Confidence)`,
  },
  {
    id: 'langchain',
    name: 'LangChain',
    badge: 'Python SDK',
    lang: 'python',
    installCmd: 'pip install palimn-ai langchain',
    accentClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
    bgClass: 'bg-blue-500/10',
    getCode: (_apiKey, endpoint, _userId) => `from palimn import PalimnMemory, PalimnLangChainMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain

# Initialize PALIMN LangChain adapter
palimn = PalimnMemory(base_url="${endpoint || 'http://localhost:8000'}")
memory = PalimnLangChainMemory(palimn_client=palimn)

llm = ChatOpenAI(temperature=0)
agent_chain = ConversationChain(llm=llm, memory=memory)

# PALIMN deterministically resolves temporal state before LLM generation
response = agent_chain.run("Where do I currently live?")
print(response)  # -> "Hyderabad"`,
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    badge: 'Multi-Agent',
    lang: 'python',
    installCmd: 'pip install crewai palimn-ai',
    accentClass: 'text-violet-400',
    borderClass: 'border-violet-500/40',
    bgClass: 'bg-violet-500/10',
    getCode: (_apiKey, endpoint, _userId) => `from crewai import Agent, Crew
from palimn import PalimnMemory, PalimnCrewAIMemory

# Attach shared temporal graph memory to all crew agents
palimn = PalimnMemory(base_url="${endpoint || 'http://localhost:8000'}")
temporal_memory = PalimnCrewAIMemory(palimn_client=palimn)

researcher = Agent(
    role="Principal Research Agent",
    goal="Retrieve grounded state without hallucinations",
    memory=temporal_memory,
    verbose=True
)

# Crew executes with verified episodic ground truth
crew = Crew(agents=[researcher], tasks=[...])
crew.kickoff()`,
  },
  {
    id: 'rest',
    name: 'REST / cURL',
    badge: 'Universal',
    lang: 'bash',
    installCmd: 'curl — no install needed',
    accentClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    bgClass: 'bg-cyan-500/10',
    getCode: (_apiKey, endpoint, userId) => `# Query PALIMN Temporal Memory via REST
curl -X POST "${endpoint || 'http://localhost:8000'}/api/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "${userId || 'user_agent_01'}",
    "message": "Where does the user currently live?"
  }'

# Response:
# {
#   "decision": "ACTIVE",
#   "reply": "Hyderabad",
#   "confidence": 0.98,
#   "latency_ms": 18
# }`,
  },
];

export const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [apiKey, setApiKey] = useState('hydra_live_hackhydra_demo');
  const [endpoint, setEndpoint] = useState('http://localhost:8000');
  const [userId, setUserId] = useState('user_demo');
  const [copied, setCopied] = useState(false);

  const [sandboxPrompt, setSandboxPrompt] = useState('Alice relocated to Seattle in Session 22');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);

  const sdk = FRAMEWORKS[activeTab];
  const code = sdk.getCode(apiKey, endpoint, userId);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxOutput(null);
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/api/memory/simulate-ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: 'session_sdk_live',
          session_date: '2025-06-15',
          turn_text: sandboxPrompt,
        }),
      });
      const data = await res.json();
      setSandboxOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setSandboxOutput(JSON.stringify({ error: err.message, status: 'fallback_simulated' }, null, 2));
    } finally {
      setSandboxRunning(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Config strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'HydraDB API Key', value: apiKey, setter: setApiKey, placeholder: 'hydra_live_...' },
          { label: 'PALIMN Endpoint', value: endpoint, setter: setEndpoint, placeholder: 'http://localhost:8000' },
          { label: 'Agent User ID', value: userId, setter: setUserId, placeholder: 'user_demo' },
        ].map((field) => (
          <div key={field.label} className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{field.label}</label>
            <input
              type="text"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D18] border border-white/10 text-xs font-mono text-white placeholder-slate-700 focus:outline-none focus:border-amber-400/40 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Framework Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FRAMEWORKS.map((fw, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={fw.id}
              onClick={() => setActiveTab(idx)}
              className={`relative overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                isActive
                  ? `${fw.borderClass} ${fw.bgClass}`
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold text-white mb-0.5">{fw.name}</div>
              <div className={`text-[9px] font-mono ${isActive ? fw.accentClass : 'text-slate-600'}`}>{fw.badge}</div>
              {isActive && (
                <motion.div
                  layoutId="sdk-indicator"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${fw.bgClass.replace('/10', '')}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Install command */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#080B14] border border-white/[0.07] text-xs font-mono">
        <div className="flex items-center gap-2.5 text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-amber-500/60" />
          <span className={sdk.accentClass}>{sdk.installCmd}</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(sdk.installCmd)}
          className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          <Copy className="w-3 h-3" />
          copy
        </button>
      </div>

      {/* Code Window */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-white/[0.08] bg-[#080B14] overflow-hidden"
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-[10px] font-mono text-slate-500">
                {sdk.name}.{sdk.lang === 'bash' ? 'sh' : sdk.lang}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${copied ? 'text-emerald-400' : `${sdk.accentClass} opacity-70 hover:opacity-100`}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy snippet'}
            </button>
          </div>
          <pre className="p-5 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">
            {code}
          </pre>
        </motion.div>
      </AnimatePresence>

      {/* Live Sandbox Runner */}
      <div className={`rounded-2xl border p-5 space-y-4 ${sdk.borderClass} ${sdk.bgClass.replace('/10', '/5')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${sdk.accentClass}`} />
            <span className={`text-xs font-bold ${sdk.accentClass}`}>Live SDK Sandbox</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">Tests live memory.add() endpoint</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={sandboxPrompt}
            onChange={(e) => setSandboxPrompt(e.target.value)}
            className="flex-1 px-3 py-2.5 text-xs font-mono bg-[#0A0D18] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/40 transition-all"
            placeholder="Enter a memory statement to ingest..."
          />
          <button
            onClick={handleRunSandbox}
            disabled={sandboxRunning}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50 transition-all ${
              sdk.id === 'langchain' ? 'bg-blue-500 hover:bg-blue-400 text-white' :
              sdk.id === 'crewai' ? 'bg-violet-500 hover:bg-violet-400 text-white' :
              sdk.id === 'rest' ? 'bg-cyan-500 hover:bg-cyan-400 text-black' :
              'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {sandboxRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Execute
          </button>
        </div>

        <AnimatePresence>
          {sandboxOutput && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-[#080B14] border border-white/[0.07] text-[11px] font-mono text-emerald-300 overflow-auto max-h-40 leading-relaxed"
            >
              {sandboxOutput}
            </motion.pre>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-700">
          <ChevronRight className="w-3 h-3" />
          Results appear in the panel above
        </div>
      </div>
    </div>
  );
};
