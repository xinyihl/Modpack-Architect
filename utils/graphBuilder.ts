
import dagre from 'dagre';
import { Node, Edge, Position, MarkerType } from 'reactflow';
import { Recipe, Resource } from '../types';

const NODE_SIZE = 80;

export const buildGraph = (resources: Resource[], recipes: Recipe[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 120, ranksep: 200 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const createdNodeIds = new Set<string>();

  const visualResources = resources.filter(r => !r.hidden);
  const resourceMap = new Map(resources.map(r => [r.id, r]));

  recipes.forEach((recipe) => {
    recipe.inputs.forEach((input) => {
      const inputRes = resourceMap.get(input.resourceId);
      if (!inputRes || inputRes.hidden) return;

      recipe.outputs.forEach((output) => {
        const outputRes = resourceMap.get(output.resourceId);
        if (!outputRes || outputRes.hidden) return;

        const edgeId = `e-${recipe.id}-${input.resourceId}-${output.resourceId}`;
        edges.push({
          id: edgeId,
          source: input.resourceId,
          target: output.resourceId,
          label: recipe.name,
          animated: true,
          style: { stroke: '#71717a', strokeWidth: 2 },
          labelStyle: { fill: '#18181b', fontSize: 11, fontWeight: 700 },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.9, rx: 4 },
          labelBgPadding: [8, 4],
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#71717a',
          },
        });

        createdNodeIds.add(input.resourceId);
        createdNodeIds.add(output.resourceId);
      });
    });
  });

  visualResources.forEach((res) => {
    if (createdNodeIds.has(res.id)) {
      dagreGraph.setNode(res.id, { width: NODE_SIZE, height: NODE_SIZE });
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  visualResources.forEach((res) => {
    if (createdNodeIds.has(res.id)) {
      const nodeWithPosition = dagreGraph.node(res.id);
      const x = nodeWithPosition ? nodeWithPosition.x : 0;
      const y = nodeWithPosition ? nodeWithPosition.y : 0;

      let borderColor = '#3f3f46';
      if (res.type === 'fluid') borderColor = '#f97316';
      if (res.type === 'item') borderColor = '#3b82f6';

      nodes.push({
        id: res.id,
        type: 'default',
        data: { label: res.name },
        position: { x: x - NODE_SIZE / 2, y: y - NODE_SIZE / 2 },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        style: {
          background: '#18181b',
          color: '#fff',
          border: `4px solid ${borderColor}`,
          borderRadius: '16px',
          width: NODE_SIZE,
          height: NODE_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: '16px',
          lineHeight: '1.1',
          padding: '8px',
          fontWeight: 900,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        },
      });
    }
  });

  return { nodes, edges };
};
