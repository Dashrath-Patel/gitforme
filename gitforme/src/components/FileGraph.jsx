import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

const FileGraph = ({ treeData, onFileSelect, onFolderSelect, focusedNode }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const simulationRef = useRef();
    const zoomRef = useRef();

    // Icon definitions remain the same
    const fileIcons = useMemo(() => ({
        js: `<path d="M12 2a2 2 0 00-2 2v2h-2a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-2 4h4v2h-4V6zm-2 4h8v8H8v-8z" />`,
        json: `<path d="M12 2a2 2 0 00-2 2v2H8a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-2 4h4v2h-4V6zm-2 4h8v6H8v-6z" />`,
        md: `<path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h16v12H4V6zm4 2v2h8V8H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z" />`,
        html: `<path d="M12 2L2 7l10 5 10-5L12 2zM4.47 8.5L12 12.5l7.53-4L12 4.5 4.47 8.5zM2 17l10 5 10-5-10-5-10 5z" />`,
        css: `<path d="M12 2L2 7l10 5 10-5L12 2zM4.47 8.5L12 12.5l7.53-4L12 4.5 4.47 8.5zM2 17l10 5 10-5-10-5-10 5z" />`,
        py: `<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5a1 1 0 112 0v5h-2V7zm0 7a1 1 0 112 0 1 1 0 01-2 0z" />`,
        default: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 4h7v5h5v11H6V4z" />`
    }), []);
    const getIcon = (filename) => fileIcons[filename.split('.').pop()] || fileIcons.default;

    // 1. Memoize data processing to prevent re-calculation on every render.
    const memoizedData = useMemo(() => {
        if (!treeData || treeData.length === 0) return { nodes: [], links: [] };

        const allNodes = treeData.map(d => ({ ...d, id: d.path, name: d.path.split('/').pop() }));
        let currentNodes;
        
        if (focusedNode) {
            // If focused, show the focused node and its immediate children.
            const focusDepth = focusedNode.path.split('/').length;
            currentNodes = allNodes.filter(n => {
                return n.id === focusedNode.id || (n.path.startsWith(focusedNode.path + '/') && n.path.split('/').length === focusDepth + 1);
            });
        } else {
            // By default, show only the top-level nodes to handle large repos.
            if (allNodes.length === 0) return { nodes: [], links: [] };
            const minDepth = Math.min(...allNodes.map(n => n.path.split('/').length));
            currentNodes = allNodes.filter(n => n.path.split('/').length === minDepth);
        }

        const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
        const currentLinks = currentNodes
            .map(n => {
                const parentPath = n.path.substring(0, n.path.lastIndexOf('/'));
                // Link to parent only if the parent is also in the current view (i.e., it's the focused node)
                if (nodeMap.has(parentPath)) {
                    return { source: parentPath, target: n.id };
                }
                return null;
            })
            .filter(Boolean);

        return { nodes: currentNodes, links: currentLinks };
    }, [treeData, focusedNode]);

    // 2. Setup effect for one-time initialization of D3, SVG, and observers.
    useEffect(() => {
        if (!containerRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

        // Clear SVG only once on setup
        svg.selectAll("*").remove(); 
        const g = svg.append('g');

        const defs = g.append('defs');
        const folderGradient = defs.append("radialGradient").attr("id", "folderGradient").attr("cx", "30%").attr("cy", "30%");
        folderGradient.append("stop").attr("offset", "0%").attr("stop-color", "#FDE68A");
        folderGradient.append("stop").attr("offset", "100%").attr("stop-color", "#FBBF24");
        
        const fileGradient = defs.append("radialGradient").attr("id", "fileGradient").attr("cx", "30%").attr("cy", "30%");
        fileGradient.append("stop").attr("offset", "0%").attr("stop-color", "#E5E7EB");
        fileGradient.append("stop").attr("offset", "100%").attr("stop-color", "#9CA3AF");

        const glow = defs.append("filter").attr("id", "glow");
        glow.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
        const feMerge = glow.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        simulationRef.current = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(100).strength(0.8))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("x", d3.forceX().strength(0.05))
            .force("y", d3.forceY().strength(0.05))
            .force("collision", d3.forceCollide().radius(d => (d.type === 'tree' ? 30 : 20) + 10));

        simulationRef.current.on("tick", () => {
            g.selectAll('.node-group').attr("transform", d => `translate(${d.x},${d.y})`);
            g.selectAll('.link-line').attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        });

        zoomRef.current = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoomRef.current);
        
        const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.7);
        svg.call(zoomRef.current.transform, initialTransform);

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || !entries.length) return;
            const { width, height } = entries[0].contentRect;
            svg.attr('width', width).attr('height', height);
        });
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // 3. Update effect to apply changes to the D3 simulation when data changes.
    useEffect(() => {
        if (!simulationRef.current || !d3.select(svgRef.current).select('g').node()) return;

        const g = d3.select(svgRef.current).select('g');
        const simulation = simulationRef.current;
        const { nodes, links } = memoizedData;

        // Update link data
        g.selectAll(".link-line")
            .data(links, d => `${d.source.id}-${d.target.id}`)
            .join(
                enter => enter.append("line")
                    .attr("class", "link-line")
                    .attr("stroke", "#9CA3AF")
                    .attr("stroke-opacity", 0)
                    .attr("stroke-width", 1.5)
                    .transition().duration(300)
                    .attr("stroke-opacity", 0.6),
                update => update,
                exit => exit.transition().duration(300).attr("stroke-opacity", 0).remove()
            );

        // Update node data
        const node = g.selectAll(".node-group")
            .data(nodes, d => d.id)
            .join(
                enter => {
                    const nodeGroup = enter.append("g").attr("class", "node-group");
                    
                    nodeGroup.attr("opacity", 0).transition().duration(300).attr("opacity", 1);
                    
                    nodeGroup.style("cursor", "pointer")
                        .on('mouseover', (event) => d3.select(event.currentTarget).select('circle').style("filter", "url(#glow)"))
                        .on('mouseout', () => d3.select(event.currentTarget).select('circle').style("filter", null))
                        .on('click', (event, d) => { if(d.type !== 'tree') onFileSelect(d); })
                        .on('dblclick', (event, d) => { if(d.type === 'tree') onFolderSelect(d); });
                    
                    nodeGroup.call(d3.drag()
                        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
                        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
                        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
                    );

                    nodeGroup.append("circle")
                        .attr("r", d => d.type === 'tree' ? 30 : 20)
                        .attr("fill", d => d.type === 'tree' ? 'url(#folderGradient)' : 'url(#fileGradient)')
                        .attr("stroke", "#111827").attr("stroke-width", 2);

                    nodeGroup.append("g").attr("transform", "translate(-10, -10)")
                        .append("svg").attr("viewBox", "0 0 24 24").attr("width", 20).attr("height", 20).attr("fill", "#1F2937")
                        .html(d => d.type === 'tree' ? `<path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />` : getIcon(d.name));
                    
                    nodeGroup.append("text").text(d => d.name)
                        .attr("y", d => (d.type === 'tree' ? 42 : 32))
                        .attr("text-anchor", "middle").attr("font-size", "12px").attr("fill", "#111827")
                        .style("pointer-events", "none").clone(true).lower().attr("stroke", "white").attr("stroke-width", 3).attr("stroke-linejoin", "round");

                    return nodeGroup;
                },
                update => update,
                exit => exit.transition().duration(300).attr("opacity", 0).remove()
            );

        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart(); // Reheat the simulation

    }, [memoizedData, onFileSelect, onFolderSelect, getIcon]);

    const handleResetView = () => {
        onFolderSelect(null);
        if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.7);
        d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, initialTransform);
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden border-2 border-black">
            <svg ref={svgRef}></svg>
            <div className="absolute top-3 right-3">
                <button onClick={handleResetView} className="px-4 py-2 bg-white/80 backdrop-blur-sm border-2 border-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md">Reset View</button>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm p-3 border-2 border-black rounded-lg text-xs max-w-sm shadow-md">
                <p><b>Navigate:</b> Scroll to zoom, drag to pan.</p>
                <p><b>Explore:</b> Click a file to preview, double-click a folder to focus.</p>
            </div>
        </div>
    );
};
export { FileGraph };
