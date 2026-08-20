import React, { useState } from 'react';
import { Copy, Check, Terminal, Cpu } from 'lucide-react';

interface FrameworkSDK {
  id: string;
  name: string;
  badge: string;
  lang: string;
  installCmd: string;
  getCode: (apiKey: string, endpoint: string, userId: string) => string;
}

const FRAMEWORKS: FrameworkSDK[] = [
  {
    id: 'langchain',
    name: 'LangChain & LangGraph',
    badge: 'Python SDK',
    lang: 'python',
    installCmd: 'pip install palimn-ai hydradb',
    getCode: (apiKey, endpoint, userId) => `from palimn.integrations.langchain import PalimnTemporalMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain

# Initialize PALIMN with HydraDB Cloud
memory = PalimnTemporalMemory(
    hydra_api_key="${apiKey || 'hydra_live_xxx'}",
    hydra_endpoint="${endpoint || 'https://hackhydra.hydradb.com'}",
    user_id="${userId || 'user_agent_01'}",
    enable_calibrated_abstention=True,
    auto_resolve_supersedes=True
)

llm = ChatOpenAI(temperature=0)
agent_chain = ConversationChain(llm=llm, memory=memory)

# PALIMN deterministically intercepts queries before LLM generation
response = agent_chain.run("Where does the user currently live?")
print(response)  # -> "Hyderabad"`,
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    badge: 'Multi-Agent',
    lang: 'python',
    installCmd: 'pip install crewai palimn-ai',
    getCode: (apiKey, endpoint, userId) => `from crewai import Agent, Task, Crew
from palimn.integrations.crewai import PalimnMemoryStorage

# Attach shared temporal graph memory to all crew agents
temporal_memory = PalimnMemoryStorage(
    hydra_api_key="${apiKey || 'hydra_live_xxx'}",
    hydra_endpoint="${endpoint || 'https://hackhydra.hydradb.com'}",
    user_id="${userId || 'user_agent_01'}"
)

researcher = Agent(
    role="Principal Research Agent",
    goal="Retrieve grounded state without hallucinations",
    memory=temporal_memory,
    verbose=True
)

# Crew executes with 0 stochastic state variance
crew = Crew(agents=[researcher], tasks=[...])
crew.kickoff()`,
  },
  {
    id: 'autogen',
    name: 'Microsoft AutoGen',
    badge: 'Stateful Agents',
    lang: 'python',
    installCmd: 'pip install pyautogen palimn-ai',
    getCode: (apiKey, endpoint, userId) => `from autogen import AssistantAgent, UserProxyAgent
from palimn.integrations.autogen import PalimnAgentContext

# Plug PALIMN memory hook into AutoGen conversation context
palimn_context = PalimnAgentContext(
    hydra_api_key="${apiKey || 'hydra_live_xxx'}",
    hydra_endpoint="${endpoint || 'https://hackhydra.hydradb.com'}",
    user_id="${userId || 'user_agent_01'}"
)

assistant = AssistantAgent(
    name="temporal_assistant",
    context_provider=palimn_context
)`,
  },
  {
    id: 'rest',
    name: 'cURL / REST API',
    badge: 'Universal HTTP',
    lang: 'bash',
    installCmd: 'curl -X POST ...',
    getCode: (apiKey, endpoint, userId) => `# Query PALIMN Temporal Memory via REST
curl -X POST "${endpoint || 'https://hackhydra.hydradb.com'}/api/chat" \\
  -H "Authorization: Bearer ${apiKey || 'hydra_live_xxx'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "${userId || 'user_agent_01'}",
    "question": "Where does the user currently live?"
  }'

# Response:
# {
#   "decision": "ACTIVE",
#   "answer": "Hyderabad",
#   "confidence": 0.98,
#   "latency_ms": 18
# }`,
  },
];

export const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [apiKey, setApiKey] = useState('hydra_live_hackhydra_demo');
  const [endpoint, setEndpoint] = useState('https://hackhydra.hydradb.com');
  const [userId, setUserId] = useState('user_demo');
  const [copied, setCopied] = useState(false);

  const sdk = FRAMEWORKS[activeTab];
  const code = sdk.getCode(apiKey, endpoint, userId);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            One-Click Framework Integration Hub
          </span>
          <h3 className="text-[22px] font-bold text-white tracking-tight">
            Drop PALIMN into Any Agent Stack in 3 Lines
          </h3>
          <p className="text-[13px] text-slate-300">
            Copy-pasteable bindings for LangChain, CrewAI, AutoGen, and Universal REST APIs.
          </p>
        </div>
      </div>

      {/* Interactive Credentials Config */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[8px] bg-[#0A0D18]/80 border border-white/[0.08] text-xs font-mono">
        <div className="space-y-1">
          <label className="text-slate-400 text-[10px] uppercase">HydraDB API Key:</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-white/[0.1] bg-[#0E1424] text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-400 text-[10px] uppercase">HydraDB Endpoint:</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-white/[0.1] bg-[#0E1424] text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-400 text-[10px] uppercase">Agent User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-white/[0.1] bg-[#0E1424] text-white"
          />
        </div>
      </div>

      {/* Framework Tabs */}
      <div className="flex flex-wrap gap-2">
        {FRAMEWORKS.map((fw, idx) => (
          <button
            key={fw.id}
            onClick={() => setActiveTab(idx)}
            className={`px-3.5 py-2 rounded-[8px] border text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === idx
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                : 'bg-[#0E1424]/80 border-white/[0.08] text-slate-300 hover:border-white/[0.18]'
            }`}
          >
            <span>{fw.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
              {fw.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Install command pill */}
      <div className="p-3 rounded-[8px] bg-black/50 border border-white/[0.08] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>{sdk.installCmd}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(sdk.installCmd);
          }}
          className="text-[11px] text-amber-400 hover:text-amber-300"
        >
          Copy cmd
        </button>
      </div>

      {/* Code Block Window */}
      <div className="code-window">
        <div className="code-window-header justify-between">
          <div className="flex items-center gap-1.5">
            <span className="code-window-dot bg-red-400" />
            <span className="code-window-dot bg-amber-400" />
            <span className="code-window-dot bg-emerald-400" />
            <span className="ml-3 text-[11px] font-mono text-slate-400">
              {sdk.name} · {sdk.lang}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 hover:text-amber-300"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
          </button>
        </div>

        <pre className="p-5 text-[12px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
};
