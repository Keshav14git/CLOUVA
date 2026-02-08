import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION_FILES } from '../lib/appwrite';
import { ZoomIn, ZoomOut, RefreshCw, Maximize } from 'lucide-react';

const NeuroGraph = () => {
    const navigate = useNavigate();
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());
    const [hoverNode, setHoverNode] = useState(null);
    const [aiLinks, setAiLinks] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [dimensions, setDimensions] = useState(null);
    // Use state instead of ref to force re-render/effect execution when element mounts
    const [containerElement, setContainerElement] = useState(null);
    const graphRef = useRef();
    const workerRef = useRef(null);

    // Initial ref callback
    const containerRefCallback = useCallback(node => {
        if (node !== null) {
            setContainerElement(node);
        }
    }, []);

    // Robust measurement using ResizeObserver on the state element
    useLayoutEffect(() => {
        if (!containerElement) return;

        const updateSize = () => {
            const { clientWidth, clientHeight } = containerElement;
            setDimensions({
                width: clientWidth,
                height: clientHeight
            });
        };

        // Initial measurement
        updateSize();

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });

        resizeObserver.observe(containerElement);

        return () => resizeObserver.disconnect();
    }, [containerElement]);

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                // Add a timeout to prevent infinite hanging
                const fetchPromise = databases.listDocuments(DATABASE_ID, COLLECTION_FILES);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 5000)
                );

                const response = await Promise.race([fetchPromise, timeoutPromise]);
                const files = response.documents;

                const nodes = [];
                const links = [];
                const addedNodes = new Set();

                files.forEach(file => {
                    if (!addedNodes.has(file.$id)) {
                        nodes.push({
                            id: file.$id,
                            name: file.name,
                            val: 20,
                            group: 'file',
                            color: '#ae0000' // Custom Red for files
                        });
                        addedNodes.add(file.$id);
                    }

                    // Process AI Categories
                    if (file.ai_categories) {
                        file.ai_categories.forEach(category => {
                            if (!addedNodes.has(`cat-${category}`)) {
                                nodes.push({
                                    id: `cat-${category}`,
                                    name: category,
                                    val: 15,
                                    group: 'category',
                                    color: '#10b981' // Emerald for categories
                                });
                                addedNodes.add(`cat-${category}`);
                            }
                            links.push({
                                source: file.$id,
                                target: `cat-${category}`,
                            });
                        });
                    }

                    // Process AI Keywords (formerly tags, or new field)
                    if (file.ai_keywords) {
                        file.ai_keywords.forEach(keyword => {
                            if (!addedNodes.has(`key-${keyword}`)) {
                                nodes.push({
                                    id: `key-${keyword}`,
                                    name: keyword,
                                    val: 10,
                                    group: 'keyword',
                                    color: '#3b82f6' // Blue for keywords
                                });
                                addedNodes.add(`key-${keyword}`);
                            }
                            links.push({
                                source: file.$id,
                                target: `key-${keyword}`,
                            });
                        });
                    }

                    // Legacy tags support (optional, can merge with keywords)
                    if (file.tags) {
                        file.tags.forEach(tag => {
                            if (!addedNodes.has(`tag-${tag}`)) {
                                nodes.push({
                                    id: `tag-${tag}`,
                                    name: tag,
                                    val: 10,
                                    group: 'tag',
                                    color: '#8b5cf6' // Violet for legacy tags
                                });
                                addedNodes.add(`tag-${tag}`);
                            }
                            links.push({
                                source: file.$id,
                                target: `tag-${tag}`,
                            });
                        });
                    }
                });

                // Mock data if empty
                if (nodes.length === 0) {
                    const mockNodes = [
                        { id: '1', name: 'Physics Notes.pdf', val: 20, group: 'file', color: '#ae0000' },
                        { id: '2', name: 'Chemistry Lab.docx', val: 20, group: 'file', color: '#ae0000' },
                        { id: 'cat-Science', name: 'Science', val: 15, group: 'category', color: '#10b981' },
                        { id: 'key-Quantum', name: 'Quantum', val: 10, group: 'keyword', color: '#3b82f6' }
                    ];
                    const mockLinks = [
                        { source: '1', target: 'cat-Science' },
                        { source: '2', target: 'cat-Science' },
                        { source: '1', target: 'key-Quantum' }
                    ];
                    setGraphData({ nodes: mockNodes, links: mockLinks });
                } else {
                    setGraphData({ nodes, links });
                    // Trigger AI Analysis if there are files
                    if (files.length > 1) {
                        analyzeSemanticLinks(files);
                    }
                }
            } catch (error) {
                console.error('Error fetching graph data:', error);
                // Fallback to mock data on error to prevent white screen
                const mockNodes = [
                    { id: '1', name: 'Physics Notes.pdf', val: 20, group: 'file', color: '#ae0000' },
                    { id: '2', name: 'Chemistry Lab.docx', val: 20, group: 'file', color: '#ae0000' },
                    { id: 'cat-Science', name: 'Science', val: 15, group: 'category', color: '#10b981' }
                ];
                const mockLinks = [
                    { source: '1', target: 'cat-Science' },
                    { source: '2', target: 'cat-Science' }
                ];
                setGraphData({ nodes: mockNodes, links: mockLinks });
            } finally {
                setLoading(false);
            }
        };

        fetchGraphData();

        // Cleanup
        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, []);

    // Reheat simulation when AI links arrive to snap them into place
    useEffect(() => {
        if (aiLinks.length > 0 && graphRef.current) {
            graphRef.current.d3ReheatSimulation();
            // Force simulation to stop after a short while to keep it static
            setTimeout(() => {
                if (graphRef.current) graphRef.current.pauseAnimation();
            }, 2000);
        }
    }, [aiLinks]);

    useEffect(() => {
        if (graphRef.current) {
            const graph = graphRef.current;
            // Configure forces - KEEP CENTER ACTIVE so nodes stay in view
            graph.d3Force('charge').strength(-100); // Less aggressive repulsion
            // graph.d3Force('center').strength(0); // DISABLED: Let it center naturally
            graph.d3Force('link').distance(70);

            // Allow initial layout to settle then pause
            setTimeout(() => {
                if (graphRef.current) {
                    graphRef.current.zoomToFit(400); // Auto-fit to ensure visibility
                    // graphRef.current.pauseAnimation(); // Optional: keep animating or pause
                }
            }, 1000);
        }
    }, [dimensions]); // Re-configure when canvas is ready

    const analyzeSemanticLinks = (files) => {
        if (!window.Worker) return;

        setIsAiLoading(true);
        if (workerRef.current) workerRef.current.terminate();

        // Use a blob to load the worker if Vite pathing issues occur, 
        // but typically standard URL works in Vite
        workerRef.current = new Worker(new URL('../worker/aiWorker.js', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (e) => {
            const { action, data } = e.data;
            if (action === 'result') {
                setAiLinks(data);
                setIsAiLoading(false);
            }
        };

        workerRef.current.postMessage({ action: 'process', data: files });
    };

    // Merge AI links into graph links for simulation
    const combinedLinks = [...graphData.links, ...aiLinks];

    const handleNodeHover = (node) => {
        setHoverNode(node || null);
        const newHighlightNodes = new Set();
        const newHighlightLinks = new Set();

        if (node) {
            newHighlightNodes.add(node.id);
            combinedLinks.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;

                if (sourceId === node.id || targetId === node.id) {
                    newHighlightLinks.add(link);
                    newHighlightNodes.add(sourceId);
                    newHighlightNodes.add(targetId);
                }
            });
        }

        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
    };

    const handleNodeClick = (node) => {
        if (!graphRef.current) return;
        if (node.group === 'file') {
            navigate(`/file/${node.id}`);
        } else {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(6, 2000);
        }
    };

    const handleLinkClick = (link) => {
        if (link.type === 'semantic') {
            navigate(`/compare/${link.source.id}/${link.target.id}`);
        }
    };

    const paintNode = useCallback((node, ctx, globalScale) => {
        const isHovered = node === hoverNode;
        const isHighlighted = highlightNodes.has(node.id);
        const label = node.name;
        const fontSize = 12 / globalScale;

        // Check for valid coordinates
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Simple Circle (No Glow)
        const size = node.val * 0.4;
        ctx.beginPath();
        ctx.fillStyle = node.color;
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.fill();

        // Active Ring for Hover
        if (isHovered || isHighlighted) {
            ctx.beginPath();
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2 / globalScale;
            ctx.arc(node.x, node.y, size + (4 / globalScale), 0, 2 * Math.PI, false);
            ctx.stroke();
        }

        // Label
        if (isHovered || isHighlighted || globalScale > 1.5) {
            ctx.font = `${isHovered ? 'bold' : ''} ${fontSize}px Inter, Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? '#000000' : 'rgba(0, 0, 0, 0.6)';
            ctx.fillText(label, node.x, node.y + (size + fontSize + 4));
        }
    }, [hoverNode, highlightNodes]);

    if (loading) return <div className="h-full flex items-center justify-center text-zinc-500 font-medium">Computing Neural Context...</div>;

    return (
        <div className="w-full h-full relative bg-zinc-50">
            <div
                ref={containerRefCallback}
                className="absolute inset-6 bg-white rounded-xl border-2 border-dashed border-zinc-200 overflow-hidden shadow-sm"
            >
                {dimensions && (
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={{ nodes: graphData.nodes, links: combinedLinks }}
                        nodeLabel="name"
                        nodeCanvasObject={paintNode}
                        linkColor={link => {
                            if (highlightLinks.has(link)) return '#ae0000';
                            return link.type === 'semantic' ? 'rgba(174, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                        linkWidth={link => (highlightLinks.has(link) ? 3 : link.type === 'semantic' ? 1.5 : 1)}
                        linkPointerAreaRadius={15}
                        linkDirectionalParticles={link => (link.type === 'semantic' || highlightLinks.has(link) ? 2 : 0)}
                        linkDirectionalParticleWidth={2}
                        linkDirectionalParticleColor={() => '#ae0000'}
                        linkDirectionalParticleSpeed={0.005}
                        backgroundColor="#ffffff"
                        onNodeHover={handleNodeHover}
                        onNodeClick={handleNodeClick}
                        onLinkClick={handleLinkClick}
                        cooldownTicks={120} // Just long enough to stabilize
                        d3AlphaDecay={0.08} // Faster cooling
                        d3VelocityDecay={0.5} // High friction for "locked" feeling
                        enableNodeDrag={true} // Allow dragging if user wants to reposition
                    />
                )}

                {/* Debug Overlay */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/75 text-white p-2 rounded text-xs z-50 pointer-events-none">
                    Dim: {dimensions ? `${dimensions.width}x${dimensions.height}` : 'Loading...'} |
                    Nodes: {graphData.nodes.length} | Links: {combinedLinks.length}
                </div>

                {isAiLoading && (
                    <div className="absolute top-24 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full border border-red-100 shadow-sm animate-pulse">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Neural Mapping...</span>
                    </div>
                )}

                {/* Controls - Floating inside the canvas */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                    <div className="bg-white p-2 flex flex-col gap-2 rounded-xl border border-zinc-200 shadow-lg shadow-zinc-200/50">
                        <button
                            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 400)}
                            className="p-2 text-zinc-500 hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 400)}
                            className="p-2 text-zinc-500 hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <button
                            onClick={() => graphRef.current?.zoomToFit(400)}
                            className="p-2 text-zinc-500 hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Fit to Screen"
                        >
                            <Maximize size={20} />
                        </button>
                        <button
                            onClick={() => {
                                if (!graphRef.current) return;
                                graphRef.current.d3ReheatSimulation();
                                graphRef.current.zoomToFit(400);
                            }}
                            className="p-2 text-zinc-500 hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Reset Layout"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Legend - Floating inside the canvas */}
                <div className="absolute top-6 left-6">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl border border-zinc-200 shadow-lg shadow-zinc-200/50">
                        <h3 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-wider text-[10px]">Graph Key</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ae0000] shadow-sm ring-1 ring-red-100"></span>
                                Files
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-100"></span>
                                Categories
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm ring-1 ring-blue-100"></span>
                                Keywords
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium mt-1 pt-2 border-t border-zinc-100">
                                <div className="w-5 h-0.5 bg-primary/20 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                                </div>
                                AI Semantic Link
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuroGraph;
