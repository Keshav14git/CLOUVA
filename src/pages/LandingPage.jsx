import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, Zap, Share2, Brain, Sparkles, Database, MessageSquareText, FileKey, Tags, Library, Cpu, Layers, Terminal, Linkedin, Plus, Minus, Beaker, GraduationCap, Code } from 'lucide-react';



const Navbar = () => (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-red-50 h-20 flex items-center transition-all duration-300">
        <div className="w-full px-8 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                <div className="w-auto h-8 flex items-center justify-center text-red-600">
                    <img src="/C.png" alt="Clouva" className="h-full w-auto object-contain" />
                </div>
            </div>
            <div className="flex items-center gap-8">
                <Link to="/login" className="text-sm font-semibold text-zinc-600 hover:text-red-600 transition-colors">Sign In</Link>
            </div>
        </div>
    </nav>
);

const HeroSection = () => {
    return (
        <section className="relative pt-40 lg:pt-56 px-6 mb-24">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-50/50 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none" />

            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-xs font-bold text-red-700 uppercase tracking-widest">v1.0 Public Beta</span>
                    </div>

                    <h1 className="text-7xl lg:text-[7rem] font-bold tracking-tighter text-zinc-900 mb-12 leading-[0.9]">
                        The OS for <br />
                        <span className="text-red-600/90 selection:text-red-900">knowledge.</span>
                    </h1>

                    <p className="text-2xl md:text-3xl text-zinc-600 mb-16 leading-relaxed font-normal max-w-2xl tracking-tight">
                        Clouva is a digital second brain that reads, understands, and connects your documents.
                    </p>

                    <div className="flex items-center gap-8">
                        <Link to="/login" className="h-16 px-10 rounded-full bg-red-600 text-white font-bold text-xl flex items-center gap-3 hover:bg-red-700 transition-all shadow-xl shadow-red-200 hover:shadow-red-300 hover:-translate-y-1">
                            Get Started
                            <ArrowRight size={24} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const TechStackSection = () => (
    <div className="border-y border-zinc-100 bg-zinc-50/30 py-16 mb-40">
        <div className="max-w-6xl mx-auto px-6">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10 w-full text-left">Built on modern infrastructure</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <TechItem
                    icon={<Cpu size={24} />}
                    name="Groq"
                    desc="Real-time LPU Inference"
                    accent="text-orange-600"
                />
                <TechItem
                    icon={<Terminal size={24} />}
                    name="Ollama"
                    desc="Local LLM Execution"
                    accent="text-blue-600"
                />
                <TechItem
                    icon={<Layers size={24} />}
                    name="Transformers.js"
                    desc="Local Vector Embeddings"
                    accent="text-yellow-600"
                />
                <TechItem
                    icon={<Database size={24} />}
                    name="Appwrite"
                    desc="Secure Backend & Auth"
                    accent="text-pink-600"
                />
            </div>
        </div>
    </div>
);

const TechItem = ({ icon, name, desc, accent }) => (
    <div className="flex flex-col gap-3 group cursor-default">
        <div className={`w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center ${accent} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <div>
            <div className="font-bold text-zinc-900 text-lg">{name}</div>
            <div className="text-sm text-zinc-500 font-medium">{desc}</div>
        </div>
    </div>
);

const features = [
    {
        number: "01",
        title: "The Vault",
        icon: <Library size={24} strokeWidth={1.5} />,
        content: [
            "Universal Storage.",
            "Stop worrying about file formats. The Vault accepts PDFs, Word documents, text files, and markdown. Once uploaded, your content is extracted, normalized, and prepared for intelligence.",
            "Every file is securely stored using enterprise-grade encryption options via Appwrite Storage."
        ]
    },
    {
        number: "02",
        title: "Librarian",
        icon: <Tags size={24} strokeWidth={1.5} />,
        content: [
            "Auto-Classification.",
            "Manual organization is a failure of software. Clouva uses Llama 3 (via Ollama) to read every page you upload.",
            "It automatically generates relevant tags, categorizes documents by topic, and organizes your library without you lifting a finger."
        ]
    },
    {
        number: "03",
        title: "Neuro-Graph",
        icon: <Share2 size={24} strokeWidth={1.5} />,
        content: [
            "Correlation Engine.",
            "Knowledge doesn't exist in a vacuum. The Neuro-Graph uses pure vector mathematics to visualize hidden connections.",
            "Traverse your entire knowledge base like a mind map, discovering links between biology textbooks and chemistry notes instantly."
        ]
    },
    {
        number: "04",
        title: "Retrieval",
        icon: <Search size={24} strokeWidth={1.5} />,
        content: [
            "Semantic Search.",
            "Keywords are obsolete. Semantic search uses local embeddings (via Transformers.js) to understand intent.",
            "Don't search for 'photosynthesis file', ask 'how do plants convert light to energy?'. We scan vectors, not just text."
        ]
    },
    {
        number: "05",
        title: "Assistant",
        icon: <MessageSquareText size={24} strokeWidth={1.5} />,
        content: [
            "Contextual Chat.",
            "Talk to your books. Powered by Groq's LPU inference, the AI Assistant responds in milliseconds.",
            "Summarize long papers, extract data tables, or debate the author's conclusions with near-zero latency."
        ]
    },
    {
        number: "06",
        title: "Mastery",
        icon: <Zap size={24} strokeWidth={1.5} />,
        content: [
            "Active Recall.",
            "Reading is passive. Learning is active. Clouva generates high-quality flashcards from any document.",
            "It identifies core concepts, definitions, and key dates, turning static text into an interactive study deck."
        ]
    }
];

/* Enterprise Grade Feature Matrix */
const EnterpriseFeatureCard = ({ feature, index }) => {
    return (
        <div className="group relative p-8 bg-white border border-zinc-200 hover:border-red-600/30 transition-all duration-500 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-zinc-50 group-hover:bg-red-50 text-zinc-900 group-hover:text-red-700 rounded-lg transition-colors duration-300">
                    {feature.icon}
                </div>
                <span className="font-mono text-xs text-zinc-400 group-hover:text-red-600 transition-colors">
                    {feature.number}
                </span>
            </div>

            <div className="mt-auto">
                <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-red-700 transition-colors">
                    {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-700 transition-colors">
                    {Array.isArray(feature.content) ? feature.content[1] : feature.content}
                </p>
            </div>
        </div>
    );
};

const EnterpriseFeatureGrid = () => {
    return (
        <section className="py-32 px-6 bg-zinc-50/50 border-b border-zinc-200">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    <div className="md:col-span-5">
                        <div className="w-12 h-1 bg-red-600 mb-8" />
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
                            Engineered for <br />
                            <span className="text-zinc-400">knowledge synthesis.</span>
                        </h2>
                    </div>
                    <div className="md:col-span-7 flex items-end">
                        <p className="text-xl text-zinc-600 leading-relaxed max-w-2xl">
                            Clouva isn't just a storage bin. It's an active processing layer for your digital life, transforming static documents into dynamic, queryable knowledge.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3">
                    {features.map((feature, idx) => (
                        <EnterpriseFeatureCard key={idx} feature={feature} index={idx} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const PhilosophySection = () => (
    <section className="py-32 px-6 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto">
            <div className="mb-20 max-w-2xl">
                <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-zinc-900 leading-[0.9] mb-8">
                    The Anti-Folder <span className="text-red-600">Manifesto.</span>
                </h2>
                <p className="text-xl text-zinc-500 font-serif italic">
                    Why we rebuilt the file system from first principles.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                <PrincipleItem
                    number="01"
                    title="Entanglement over Hierarchy."
                    desc="Folders are artifacts of physical filing cabinets. In the human brain, information is a network, not a tree. Clouva treats every file as a node, connected by meaning rather than location."
                />
                <PrincipleItem
                    number="02"
                    title="Speed is Intelligence."
                    desc="The barrier to knowledge isn't lack of information, it's the friction of lookup. When retrieval is instant, you stop searching and start thinking. Clouva is optimized for <100ms query times."
                />
                <PrincipleItem
                    number="03"
                    title="Privacy is Non-Negotiable."
                    desc="Your second brain shouldn't belong to a corporation. We use local-first vector embeddings and Appwrite's self-hostable infrastructure to ensure your thoughts remain yours alone."
                />
            </div>
        </div>
    </section>
);

const PrincipleItem = ({ number, title, desc }) => (
    <div className="flex flex-col gap-6 border-t border-zinc-200 pt-8">
        <span className="text-red-600 font-mono text-sm tracking-widest">{number}</span>
        <h3 className="text-2xl font-bold text-zinc-900 leading-tight">{title}</h3>
        <p className="text-lg text-zinc-600 leading-relaxed text-pretty">{desc}</p>
    </div>
);

const UseCasesSection = () => (
    <section className="py-32 px-6 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900">
                    Who is Clouva for?
                </h2>
                <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase border-b border-zinc-300 pb-1">
                    Target Profiles
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <UseCaseDossier
                    role="The Researcher"
                    problem="Drowning in 50+ open PDF tabs, struggling to find the one contradiction between Author A and Author B."
                    solution="Upload entire bibliographies. Ask Clouva to 'synthesize the conflicting arguments regarding transformer attention mechanisms'."
                />
                <UseCaseDossier
                    role="The Software Engineer"
                    problem="Navigating legacy codebases with outdated documentation. Searching for 'auth flow' yields 500 greedy grep results."
                    solution="Ingest the repo. Query specific architectural patterns: 'Where is the user session invalidated during OAuth refresh?'"
                />
                <UseCaseDossier
                    role="The Medical Student"
                    problem="Passive reading of 1,000 page textbooks with low retention. High anxiety about comprehensive board exams."
                    solution="Active recall generated instantly. 'Create a 20-question quiz on cardiac pharmacology, focused on beta-blocker contraindications'."
                />
            </div>
        </div>
    </section>
);

const UseCaseDossier = ({ role, problem, solution }) => (
    <div className="bg-white border border-zinc-200 p-8 flex flex-col h-full hover:border-red-200 transition-colors duration-300">
        <h3 className="text-2xl font-bold text-zinc-900 mb-8 font-serif italic">{role}</h3>

        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pain Point</span>
            </div>
            <p className="text-zinc-600 leading-relaxed min-h-[80px]">{problem}</p>
        </div>

        <div className="mt-auto pt-8 border-t border-dashed border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">The Clouva Fix</span>
            </div>
            <p className="text-zinc-900 font-medium leading-relaxed">{solution}</p>
        </div>
    </div>
);

const FAQSection = () => {
    const questions = [
        {
            q: "Technical Architecture: How is data stored?",
            a: "We utilize Appwrite's separate storage buckets for file persistence, while ensuring all metadata is encrypted at rest. Vector embeddings are generated locally or via secure private endpoints, meaning your raw semantic data is never exposed to public model training data."
        },
        {
            q: "Model Inference: Llama 3 vs Private Deployment",
            a: "By default, Clouva utilizes an optimized Groq-accelerated Llama 3 pipeline for sub-second inference. For enterprise clients, we support fully local setups using Ollama, allowing you to run the entire stack (including generation) air-gapped on your own hardware."
        },
        {
            q: "Roadmap: Handwriting & Multimodal Support",
            a: "Native OCR for handwritten notes (iPad/tablet usage) is currently in alpha and scheduled for Q4 release. We are also testing Vision transformers to allow 'querying' of charts and diagrams within your PDF uploads."
        },
    ];

    return (
        <section className="py-32 px-6 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tighter text-zinc-900 mb-20">Frequent Inquiries.</h2>
            <div className="border-t-2 border-zinc-900">
                {questions.map((item, i) => (
                    <FAQItem key={i} question={item.q} answer={item.a} />
                ))}
            </div>
        </section>
    );
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-zinc-200 py-8 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex justify-between items-start md:items-center gap-6">
                <h3 className={`text-xl md:text-2xl font-bold tracking-tight transition-colors ${isOpen ? 'text-red-600' : 'text-zinc-900 group-hover:text-red-600'}`}>
                    {question}
                </h3>
                <div className={`shrink-0 w-8 h-8 flex items-center justify-center border transition-colors ${isOpen ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-200 text-zinc-400'}`}>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-6 text-lg text-zinc-600 leading-relaxed max-w-2xl">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const CTASection = () => (
    <div className="max-w-6xl mx-auto px-6 pt-40 pb-20 border-t-2 border-red-600 mt-40">
        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 mb-12">
            Build your <br />
            <span className="text-red-600">library.</span>
        </h2>
        <Link to="/login" className="inline-block px-12 py-5 bg-red-600 text-white text-xl font-bold tracking-tight rounded-full hover:bg-red-700 transition-all shadow-xl shadow-red-200">
            Get Started
        </Link>
    </div>
);

const Footer = () => (
    <footer className="py-8 px-6 bg-red-50/30 border-t border-red-100">
        <div className="w-full px-8 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-2">
                <img src="/C.png" alt="Clouva" className="h-8 w-auto" />
            </div>
            <div className="text-sm font-medium text-zinc-500">
                &copy; {new Date().getFullYear()} Clouva. All rights reserved.
            </div>
            <a
                href="https://www.linkedin.com/in/keshavjangir14/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-600 hover:text-[#0077b5] transition-colors font-medium border border-zinc-200 px-4 py-2 rounded-full bg-white hover:border-[#0077b5]"
            >
                <Linkedin size={20} />
                <span>Connect on LinkedIn</span>
            </a>
        </div>
    </footer>
);

const LandingPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-red-100 selection:text-red-900">
            <Navbar />

            <main className="pb-32">
                <HeroSection />
                <TechStackSection />
                <PhilosophySection />
                <EnterpriseFeatureGrid />
                <UseCasesSection />
                <FAQSection />
                <CTASection />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
